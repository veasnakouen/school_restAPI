using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonLinkToAppUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PersonId",
                table: "AppUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_PersonId",
                table: "AppUsers",
                column: "PersonId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_Persons_PersonId",
                table: "AppUsers",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_Persons_PersonId",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_PersonId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "PersonId",
                table: "AppUsers");
        }
    }
}
