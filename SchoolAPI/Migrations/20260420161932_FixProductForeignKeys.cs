using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixProductForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssignments_Products_ProductId1",
                table: "AssetAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssignments_PurchaseItems_PurchaseItemId1",
                table: "AssetAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetTransfers_Products_ProductId1",
                table: "AssetTransfers");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRecords_Products_ProductId1",
                table: "MaintenanceRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Products_ProductId1",
                table: "StockMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_PurchaseItems_PurchaseItemId1",
                table: "StockMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_WriteOffs_Products_ProductId1",
                table: "WriteOffs");

            migrationBuilder.DropForeignKey(
                name: "FK_WriteOffs_PurchaseItems_PurchaseItemId1",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_WriteOffs_ProductId1",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_WriteOffs_PurchaseItemId1",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_ProductId1",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_PurchaseItemId1",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRecords_ProductId1",
                table: "MaintenanceRecords");

            migrationBuilder.DropIndex(
                name: "IX_AssetTransfers_ProductId1",
                table: "AssetTransfers");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssignments_ProductId1",
                table: "AssetAssignments");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssignments_PurchaseItemId1",
                table: "AssetAssignments");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "WriteOffs");

            migrationBuilder.DropColumn(
                name: "PurchaseItemId1",
                table: "WriteOffs");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "PurchaseItemId1",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "MaintenanceRecords");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "AssetTransfers");

            migrationBuilder.DropColumn(
                name: "ProductId1",
                table: "AssetAssignments");

            migrationBuilder.DropColumn(
                name: "PurchaseItemId1",
                table: "AssetAssignments");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "Persons",
                newName: "DepartmentId");

            migrationBuilder.AlterColumn<string>(
                name: "PurchaseItemId",
                table: "WriteOffs",
                type: "text",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "WriteOffs",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "PurchaseItemId",
                table: "StockMovements",
                type: "text",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "StockMovements",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Persons",
                type: "boolean",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "MaintenanceRecords",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "AssetTransfers",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "PurchaseItemId",
                table: "AssetAssignments",
                type: "text",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "AssetAssignments",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_ProductId",
                table: "WriteOffs",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_PurchaseItemId",
                table: "WriteOffs",
                column: "PurchaseItemId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ProductId",
                table: "StockMovements",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_PurchaseItemId",
                table: "StockMovements",
                column: "PurchaseItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_DepartmentId",
                table: "Persons",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_ProductId",
                table: "MaintenanceRecords",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_ProductId",
                table: "AssetTransfers",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_ProductId",
                table: "AssetAssignments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_PurchaseItemId",
                table: "AssetAssignments",
                column: "PurchaseItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssignments_Products_ProductId",
                table: "AssetAssignments",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssignments_PurchaseItems_PurchaseItemId",
                table: "AssetAssignments",
                column: "PurchaseItemId",
                principalTable: "PurchaseItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTransfers_Products_ProductId",
                table: "AssetTransfers",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRecords_Products_ProductId",
                table: "MaintenanceRecords",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Persons_Departments_DepartmentId",
                table: "Persons",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_PurchaseItems_PurchaseItemId",
                table: "StockMovements",
                column: "PurchaseItemId",
                principalTable: "PurchaseItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WriteOffs_Products_ProductId",
                table: "WriteOffs",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WriteOffs_PurchaseItems_PurchaseItemId",
                table: "WriteOffs",
                column: "PurchaseItemId",
                principalTable: "PurchaseItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssignments_Products_ProductId",
                table: "AssetAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetAssignments_PurchaseItems_PurchaseItemId",
                table: "AssetAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetTransfers_Products_ProductId",
                table: "AssetTransfers");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRecords_Products_ProductId",
                table: "MaintenanceRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_Persons_Departments_DepartmentId",
                table: "Persons");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_PurchaseItems_PurchaseItemId",
                table: "StockMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_WriteOffs_Products_ProductId",
                table: "WriteOffs");

            migrationBuilder.DropForeignKey(
                name: "FK_WriteOffs_PurchaseItems_PurchaseItemId",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_WriteOffs_ProductId",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_WriteOffs_PurchaseItemId",
                table: "WriteOffs");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_ProductId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_PurchaseItemId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_Persons_DepartmentId",
                table: "Persons");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRecords_ProductId",
                table: "MaintenanceRecords");

            migrationBuilder.DropIndex(
                name: "IX_AssetTransfers_ProductId",
                table: "AssetTransfers");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssignments_ProductId",
                table: "AssetAssignments");

            migrationBuilder.DropIndex(
                name: "IX_AssetAssignments_PurchaseItemId",
                table: "AssetAssignments");

            migrationBuilder.RenameColumn(
                name: "DepartmentId",
                table: "Persons",
                newName: "Department");

            migrationBuilder.AlterColumn<Guid>(
                name: "PurchaseItemId",
                table: "WriteOffs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "WriteOffs",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ProductId1",
                table: "WriteOffs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PurchaseItemId1",
                table: "WriteOffs",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "PurchaseItemId",
                table: "StockMovements",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "StockMovements",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ProductId1",
                table: "StockMovements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseItemId1",
                table: "StockMovements",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Persons",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "MaintenanceRecords",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ProductId1",
                table: "MaintenanceRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "AssetTransfers",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ProductId1",
                table: "AssetTransfers",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "PurchaseItemId",
                table: "AssetAssignments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "AssetAssignments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ProductId1",
                table: "AssetAssignments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseItemId1",
                table: "AssetAssignments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_ProductId1",
                table: "WriteOffs",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_PurchaseItemId1",
                table: "WriteOffs",
                column: "PurchaseItemId1");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ProductId1",
                table: "StockMovements",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_PurchaseItemId1",
                table: "StockMovements",
                column: "PurchaseItemId1");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_ProductId1",
                table: "MaintenanceRecords",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_ProductId1",
                table: "AssetTransfers",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_ProductId1",
                table: "AssetAssignments",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_PurchaseItemId1",
                table: "AssetAssignments",
                column: "PurchaseItemId1");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssignments_Products_ProductId1",
                table: "AssetAssignments",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetAssignments_PurchaseItems_PurchaseItemId1",
                table: "AssetAssignments",
                column: "PurchaseItemId1",
                principalTable: "PurchaseItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTransfers_Products_ProductId1",
                table: "AssetTransfers",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRecords_Products_ProductId1",
                table: "MaintenanceRecords",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Products_ProductId1",
                table: "StockMovements",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_PurchaseItems_PurchaseItemId1",
                table: "StockMovements",
                column: "PurchaseItemId1",
                principalTable: "PurchaseItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WriteOffs_Products_ProductId1",
                table: "WriteOffs",
                column: "ProductId1",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WriteOffs_PurchaseItems_PurchaseItemId1",
                table: "WriteOffs",
                column: "PurchaseItemId1",
                principalTable: "PurchaseItems",
                principalColumn: "Id");
        }
    }
}
