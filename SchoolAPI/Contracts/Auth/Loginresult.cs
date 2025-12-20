namespace SchoolAPI.Contracts.Auth;

public class LoginResult
{
    ///<summary>
    ///TRUE if the login attempt is successful, False otherwise 
    ///</summary> 
    public string Message { get; set; } = null!;
    /// <summary>
    /// The JWT token if the login attempt is successful, or NULL if not
    /// </summary>
    public string? Token { get; set; }
}