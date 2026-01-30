using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolAPI.Constant;
using SchoolAPI.Constant.Auth;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;
using SchoolAPI.Services;

namespace SchoolAPI.Controllers
{
    public class AuthController : BaseController
    {
        // this is also the method
        // public string Message => "sksdf";
        // #region is using for organization of code,end with #endregion, make it easy to read
        #region Constructor Injection
        // these (three) build-in libraries
        private readonly RoleManager<IdentityRole> _roleManager;

        private readonly SignInManager<AppUser> _signInManager;
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;
        private IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly SchoolDbContext _context;
        private readonly ITokenServices _tokenServices;

        public AuthController(
            UserManager<AppUser> userManager,
            ITokenService tokenService,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            SignInManager<AppUser> signInManager,
            SchoolDbContext context,
            ITokenServices tokenServices,
            IMapper mapper)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _roleManager = roleManager;
            _configuration = configuration;
            _signInManager = signInManager;
            _mapper = mapper;
            _context = context;
            _tokenServices = tokenServices;
            // var today = DateOnly.FromDateTime(DateTime.UtcNow);
        }
        #endregion
        // without UserManager
        //not yet working
        [HttpPost("user register")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDto>> RegisterUser([FromBody] RegisterDto dto)
        {
            if (await UserExists(dto.Username)) return BadRequest("UserName is taken!.");

            using var hmac = new HMACSHA512();
            // var user = new AppUser
            // {
            //     UserName = dto.Username.ToLower(),
            //     Email = dto.Email,

            //     // PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password)).ToString(),
            //     // PasswordSalt = hmac.Key
            // };
            var user = _mapper.Map<AppUser>(dto);
            user.UserName = dto.Username.ToLower();
            var result = await _userManager.CreateAsync(user, dto.Password);

            // return new UserDto
            // {
            //     UserName = user.UserName,
            //     Token = _tokenServices.CreateToken(user)
            // };
            // return _mapper.Map<UserDto>(user);
            // ✅ Use constant: Roles.User
            if (!result.Succeeded) return BadRequest(result.Errors);

            if (dto.Roles is null)
            {
                await _userManager.AddToRoleAsync(user, Roles.User);
            }
            else
            {
                foreach (var role in dto.Roles)
                {
                    await _userManager.AddToRoleAsync(user, role);
                }
            }
            return Ok("User registered successfully.");
        }

        [HttpPost("LoginUser")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDto>> LoginUser([FromBody] LoginRequest dto)
        {
            // var user = await _context.Users.FirstOrDefaultAsync();
            var user = await _context.Users
                .SingleOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password)) return Unauthorized("Invalid UserName!.");

            return new UserDto
            {
                UserName = user.UserName,
                Token = _tokenServices.CreateToken(user)
            };

        }



        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // var existedUser= await _userManager.FindByEmailAsync(request.Email);
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var existedUser = await _userManager.FindByNameAsync(request.Email);
            if (existedUser != null) return BadRequest("User already exists with this email.");

            // var user = new AppUser
            // {
            //     UserName = request.Email,
            //     Email = request.Email,
            //     FullName = request.FullName,
            // };

            var user = _mapper.Map<AppUser>(request);
            user.UserName = request.Email;

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // ✅ Use constant: Roles.User
            if (request.Roles is null)
            {
                await _userManager.AddToRoleAsync(user, Roles.User);
            }
            else
            {
                foreach (var role in request.Roles)
                {
                    await _userManager.AddToRoleAsync(user, role);
                }
            }
            return Ok("User registered successfully.");


        }


        // use this if want return with the form of <AuthResponse> 
        // public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request) { }
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            //do checking model state
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            // we also can split it for checking the exact error (user or password)
            // if (user == null){} then var result = await _userManager.CheckPasswordAsync(user,request.Password); if(!result){}
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                return Unauthorized("Invalid credentials.");


            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            await _signInManager.SignInAsync(user, isPersistent: false);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                UserId = user.Id,
                Email = user.Email!,
                FullName = user.FullName!
            };

            return Ok(response);
        }


        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)//[FromQuery]​​​​​​ 
        {
            var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal == null) return BadRequest("Invalid access token.");

            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null) return BadRequest("Invalid token.");

            var user = await _userManager.FindByEmailAsync(email);
            // var user = await existedUserByEmail(email);  
            if (user == null ||
                user.RefreshToken != request.RefreshToken ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return Unauthorized("Invalid refresh token.");

            var roles = await _userManager.GetRolesAsync(user);
            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            // TODO: consider using with auto mapper
            var response = new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                UserId = user.Id,
                Email = user.Email!,
                FullName = user.FullName!
            };

            return Ok(response);
        }


        //TODO: update profile
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserDetail request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized("User not found.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found.");

            user.FullName = request.FullName ?? user.FullName;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            await _userManager.AddToRoleAsync(user, request.Roles?.FirstOrDefault());


            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);


            return Ok("Profile updated successfully.");
        }


        [HttpGet("profile")]
        [Authorize(Roles = "Admin")]//allow only Admin
        public async Task<ActionResult<UserDetail>> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized("User not found.");

            var user = await _userManager.FindByIdAsync(userId);

            // if (user == null) return NotFound("User not found.");
            if (user is null) return NotFound("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            var profile = new
            {
                user.Id,
                user.FullName,
                user.Email,
                Roles = roles,
                user.PhoneNumber,
                user.PhoneNumberConfirmed,
                user.AccessFailedCount
            };

            return Ok(profile);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<AuthResponse>> GetUser(Guid id)
        {

            var user = await _userManager.FindByIdAsync(id.ToString());


            return _mapper.Map<AuthResponse>(user);

        }


        [HttpGet("users")]
        // [Authorize]
        // [Authorize(Roles = "Admin")]
        // [Authorize(Policy = "AdminOnly")] ::> builder.Services.AddAuthorization(options =>options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin")));
        //[Authorize(Policy = "EmployeeIdPolicy")] ::> builder.Services.AddAuthorization(options =>options.AddPolicy("EmployeeIdPolicy", policy => policy.RequireClaim("EmployeeId")));
        // [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> GetAllUsers(string? filterOn = null, string? filterQuery = null)
        {
            var users = new List<AppUser>();
            if (filterOn != null && filterQuery != null)
            {
                // using EF.Functions.Like
                users = _userManager.Users
                    .Where(u => EF.Functions.Like(u.FullName, $"%{filterQuery}%"))
                    .ToList();

                var userListLinq = new List<object>();
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userListLinq.Add(new
                    {
                        user.Id,
                        user.FullName,
                        user.Email,
                        Roles = roles
                    });
                }

                return Ok(userListLinq);
            }
            // // using OCP example
            users = _userManager.Users.ToList();
            var bf = new BetterFilter();
            IEnumerable<AppUser> result = new List<AppUser>();

            if (filterOn == "name")
            {
                result = bf.Filter(users, new ColorSpecification(filterQuery));
            }

            var userListOCP = new List<object>();
            foreach (var user in result)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userListOCP.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    Roles = roles
                });
            }

            return Ok(userListOCP);



            // users = _userManager.Users.ToList();
            // var userList = new List<object>();

            // foreach (var user in users)
            // {
            //     var roles = await _userManager.GetRolesAsync(user);
            //     userList.Add(new
            //     {
            //         user.Id,
            //         user.FullName,
            //         user.Email,
            //         Roles = roles
            //     });
            // }

            // return Ok(userList);
        }


        //
        [HttpGet("details")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<UserDetail>> GetUserDetail(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null) return NotFound("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            // var userDetail = new UserDetail
            // {
            //     Id = user.Id,
            //     FullName = user.FullName!,
            //     Email = user.Email!,
            //     PhoneNumber = user.PhoneNumber,
            //     Roles = roles.ToList(),
            //     PhoneNumberConfirm = user.PhoneNumberConfirmed,
            //     AccessFailedCount = user.AccessFailedCount
            // };
            var userDetail = _mapper.Map<UserDetail>(user);
            userDetail.Roles = roles.ToList();

            return Ok(userDetail);

        }


        // function for Generate token but our above code we use the TokenService
        // we split it for better organization of code
        private string GenerateToken(AppUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration.GetSection("JwtSettings").GetSection("Secret").Value);
            var roles = _userManager.GetRolesAsync(user).Result;

            List<Claim> claims =
            [
                new (JwtRegisteredClaimNames.Email,user.Email ?? ""),
                new (JwtRegisteredClaimNames.Name,user.FullName ?? ""),
                new (JwtRegisteredClaimNames.NameId,user.Id ?? ""),
                new (JwtRegisteredClaimNames.Aud,
                _configuration.GetSection("JwtSettings").GetSection("Audience").Value),
                new (JwtRegisteredClaimNames.Iss,_configuration.GetSection("JwtSettings").GetSection("schoolAPI").Value!)
            ];

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        [HttpGet("Toon")]
        [AllowAnonymous]
        public async Task<ActionResult<string>> GetToon()
        {
            var toonResponse = new AppUser();

            return await Task.FromResult<ActionResult<string>>("Toon is the best character in One Piece!");
        }


        #region Open-Closed Principle (OCP) Example
        public interface ISpecification<T> where T : class
        {
            bool IsSatisfiedBy(T item);
        }
        public interface IFilter<T> where T : class
        {
            IEnumerable<T> Filter(IEnumerable<T> items, ISpecification<T> spec);
        }

        public class ColorSpecification : ISpecification<AppUser>
        {
            private readonly string _color;

            public ColorSpecification(string color)
            {
                _color = color;
            }

            public bool IsSatisfiedBy(AppUser user)
            {
                if (user.FullName == _color)
                {
                    return true;
                }
                return false;
            }
        }
        public class BetterFilter : IFilter<AppUser>
        {
            public IEnumerable<AppUser> Filter(IEnumerable<AppUser> items, ISpecification<AppUser> spec)
            {
                foreach (var item in items)
                {
                    if (spec.IsSatisfiedBy(item))
                    {
                        yield return item;
                    }
                }
            }
        }

        #endregion
        // testing for get user without aut 
        [HttpGet("AllUsers")]
        [Authorize(Roles = "Admin")]
        // public async Task<ActionResult<IReadOnlyList<AppUser>>> GetUsers()
        // public ActionResult<IReadOnlyList<AppUser>> GetUsers()
        public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            // var users = _userManager.Users.ToList();
            return Ok(users);
        }

        // some functions
        async Task<bool> ExistedUser(string id)
        {
            var existedUser = await _userManager.FindByIdAsync(id);
            if (existedUser != null)
            {
                return true;
            }
            // await HttpContext.Response.WriteAsJsonAsync(existedUser);
            return false;
        }

        private async Task<bool> UserExists(string username)
        {
            return await _context.Users.AnyAsync(u => u.UserName.ToLower() == username.ToLower());
        }

        // Testing Controller
        public class Product
        {
            public string Id { get; set; } = new Guid().ToString();
            // [Required(ErrorMessage = "The field Name is required")]
            // [MinLength(3, ErrorMessage = "The name field must have at least 3 characters.")]
            public string ProductName { get; set; }
            public decimal Price { get; set; }
            public string? ImageUrl { get; set; }
        }

        public class ProductDto
        {
            [Required(ErrorMessage = "The field Name is required")]
            [MinLength(3, ErrorMessage = "The name field must have at least 3 characters.")]
            public string ProductName { get; set; }
            public decimal Price { get; set; }
            public string? ImageUrl { get; set; }
        }


        [HttpGet("getTask")]
        public IActionResult GetTask([FromQuery] bool isCompleted = false)
        {
            var product = new Product
            {
                Id = new Guid().ToString(),
                ProductName = "IPhone 18",
                Price = 1500
            };
            if (product.Price < 0)
                ModelState.AddModelError("Price", "The Price field cannot have a value less than zero.");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            isCompleted = true;
            return Ok(product);
        }


    }
}

