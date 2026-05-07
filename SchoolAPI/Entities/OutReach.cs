namespace SchoolAPI.Entities
{
    public class OutReach
    {
        public Guid Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? ImageUrl { get; set; }

    public string? NickName { get; set; }
        public string? Contact { get; set; } = string.Empty;
        public ICollection<Student> Students { get; set; } = new List<Student>();
        // public IFormFile Image { get; set; }
    }
}