using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddImagesField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "OutReaches",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "OutReaches");
        }
    }
}
