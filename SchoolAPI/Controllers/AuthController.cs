#nullable enable
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Entities;
using SchoolAPI.Services;

namespace SchoolAPI.Controllers;

public class AuthController : BaseController
{
    private const string UserNotFound = "User not found.";

    private readonly SignInManager<AppUser> _signInManager;
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;

    public AuthController(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        SignInManager<AppUser> signInManager,
        IMapper mapper,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _signInManager = signInManager;
        _mapper = mapper;
        _jwtSettings = jwtSettings.Value;
    }

    private DateTime GetRefreshTokenExpiryUtc()
    {
        var refreshTokenExpiryInDays = _jwtSettings.RefreshTokenExpiryInDays > 0
            ? _jwtSettings.RefreshTokenExpiryInDays
            : 7;

        return DateTime.UtcNow.AddDays(refreshTokenExpiryInDays);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existedUser = await _userManager.FindByEmailAsync(request.Email);
        if (existedUser != null) return BadRequest("User already exists with this email.");

        var user = _mapper.Map<AppUser>(request);
        user.UserName = request.Email;

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, Roles.User);

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized("Invalid credentials.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = GetRefreshTokenExpiryUtc();
        await _userManager.UpdateAsync(user);

        await _signInManager.SignInAsync(user, isPersistent: false);

        var response = new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120),
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null) return BadRequest("Invalid access token.");

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst(ClaimTypes.Name)?.Value
            ?? principal.FindFirst("email")?.Value;
        if (email == null) return BadRequest("Invalid token.");

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null ||
            user.RefreshToken != request.RefreshToken ||
            user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Unauthorized("Invalid refresh token.");

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = GetRefreshTokenExpiryUtc();
        await _userManager.UpdateAsync(user);

        var response = new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120),
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName
        };

        return Ok(response);
    }

    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UserDetail request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(UserNotFound);

        user.FullName = request.FullName ?? user.FullName;
        user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Profile updated successfully.");
    }

    [HttpGet("profile")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<UserDetail>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(UserNotFound);

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
        if (user == null) return NotFound("User not found.");
        return Ok(_mapper.Map<AuthResponse>(user));
    }

    [HttpGet("users")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetAllUsers(string? filterOn = null, string? filterQuery = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (filterOn?.Equals("name", StringComparison.OrdinalIgnoreCase) == true && !string.IsNullOrEmpty(filterQuery))
        {
            query = query.Where(u => EF.Functions.Like(u.FullName, $"%{filterQuery}%"));
        }

        var users = await query.AsNoTracking().ToListAsync();

        var userList = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userList.Add(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                Roles = roles
            });
        }

        return Ok(userList);
    }

    [HttpGet("details")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<UserDetail>> GetUserDetail(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(UserNotFound);

        var roles = await _userManager.GetRolesAsync(user);

        var userDetail = _mapper.Map<UserDetail>(user);
        userDetail.Roles = roles.ToList();

        return Ok(userDetail);
    }
}
