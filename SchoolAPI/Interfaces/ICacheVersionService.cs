namespace SchoolAPI.Interfaces;

public interface ICacheVersionService
{
    string GetVersion(string scope);
    void Invalidate(string scope);
}