using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductExportFieldsToSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProductExportFields",
                table: "SystemSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResponsiblePersonId",
                table: "Products",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_ResponsiblePersonId",
                table: "Products",
                column: "ResponsiblePersonId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Persons_ResponsiblePersonId",
                table: "Products",
                column: "ResponsiblePersonId",
                principalTable: "Persons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Persons_ResponsiblePersonId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ResponsiblePersonId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ProductExportFields",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "ResponsiblePersonId",
                table: "Products");
        }
    }
}
