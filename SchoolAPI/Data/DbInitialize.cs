using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;

namespace SchoolAPI.Data;

public class DbInitialize
{
    // This is for seeding initial data into the database
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        SeedingData(scope.ServiceProvider.GetService<SchoolDbContext>());
    }


    private static void SeedingData(SchoolDbContext context)
    {
        context.Database.Migrate();
        if (context.Students.Any())
        {
            Console.WriteLine("Already have data");
            return;   // DB has been seeded
        }
        var students = new List<Student>
        {
            // TODO: Create list of new Student
            //  objects here
            // new Student{KhFirstName="សុភា",KhLastName="ជូត",EngFirstName="Sophea",EngLastName="Chhout",.....},
            // new Student{KhFirstName="សឿត",KhLastName="គង់",EngFirstName="soeut",EngLastName="Kong",.....},

        };
        var student = new Student
        {
            KhFirstName = "សុខ",
            KhLastName = "សុវណ្ណ",
            EngFirstName = "Sok",
        };

        context.AddRange(students);

        context.SaveChanges();
    }
}

#region Another Seed Example
public class SeedUserDto
{
    public string UserName { get; set; }
    public string Email { get; set; }
    // other properties as needed
}


public class SeedUser
{
    // TODO : this function to seed users not yet completed

    public static async Task SeedUsers(SchoolDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        //Read user data from json file
        var userData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var users = JsonSerializer.Deserialize<List<SeedUserDto>>(userData);

        if (users == null)
        {
            Console.WriteLine("No users in seed data.");
            return;
        }
    }
}
#endregion