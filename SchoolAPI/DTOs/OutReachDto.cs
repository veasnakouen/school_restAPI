namespace SchoolAPI.DTOs
{
    public class OutReachDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? NickName { get; set; }
        public string? Contact { get; set; }
        public List<StudentDto> Students { get; set; } = new List<StudentDto>();
    }
    public class CreateOutReachDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? NickName { get; set; }
        public string? Contact { get; set; }
    }

}