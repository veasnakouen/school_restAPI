using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLogoToSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoBase64",
                table: "SystemSettings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoBase64",
                table: "SystemSettings");
        }
    }
}
