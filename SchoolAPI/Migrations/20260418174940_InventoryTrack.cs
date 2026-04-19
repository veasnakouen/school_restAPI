using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAPI.Migrations
{
    /// <inheritdoc />
    public partial class InventoryTrack : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UpdateDate",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "VoucherNumber",
                table: "Products",
                newName: "ProductName");

            migrationBuilder.RenameColumn(
                name: "Donor",
                table: "Products",
                newName: "ProductCode");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:hstore", ",,");

            migrationBuilder.AddColumn<int>(
                name: "AssignedQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Dictionary<string, string>>(
                name: "Attributes",
                table: "Products",
                type: "hstore",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "AvailableQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TotalQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AttributeSchema",
                table: "Categories",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Categories",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Categories",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Categories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Persons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Persons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Purchases",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SupplierId = table.Column<string>(type: "text", nullable: false),
                    VoucherNumber = table.Column<string>(type: "text", nullable: true),
                    InvoiceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Purchases_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MaintenanceNumber = table.Column<string>(type: "text", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId1 = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    IssuedescRiption = table.Column<string>(type: "text", nullable: true),
                    ResolutionDescription = table.Column<string>(type: "text", nullable: true),
                    ConditionBefore = table.Column<int>(type: "integer", nullable: false),
                    ConditionAfter = table.Column<int>(type: "integer", nullable: true),
                    EstimatedCost = table.Column<decimal>(type: "numeric", nullable: true),
                    ActualCost = table.Column<decimal>(type: "numeric", nullable: true),
                    TechnicianId = table.Column<Guid>(type: "uuid", nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentForMaintenanceMovementId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReturnedFromMaintenanceMovementId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceRecords_Persons_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRecords_Products_ProductId1",
                        column: x => x.ProductId1,
                        principalTable: "Products",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PurchaseItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PurchaseId = table.Column<string>(type: "text", nullable: false),
                    ProductId = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    PercentNew = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    ResponsiblePersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    SerialNumber = table.Column<string>(type: "text", nullable: true),
                    ExtraAttributes = table.Column<Dictionary<string, string>>(type: "hstore", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseItems_Persons_ResponsiblePersonId",
                        column: x => x.ResponsiblePersonId,
                        principalTable: "Persons",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseItems_Purchases_PurchaseId",
                        column: x => x.PurchaseId,
                        principalTable: "Purchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StockMovements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Direction = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId1 = table.Column<string>(type: "text", nullable: true),
                    PurchaseItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    PurchaseItemId1 = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    QuantityBefore = table.Column<int>(type: "integer", nullable: false),
                    QuantityAfter = table.Column<int>(type: "integer", nullable: false),
                    UnitPriceAtMovement = table.Column<decimal>(type: "numeric", nullable: true),
                    FromLocation = table.Column<string>(type: "text", nullable: true),
                    ToLocation = table.Column<string>(type: "text", nullable: true),
                    FromPersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToPersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    MovedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    ReferenceNumber = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    PercentNewBefore = table.Column<int>(type: "integer", nullable: true),
                    PercentNewAfter = table.Column<int>(type: "integer", nullable: true),
                    MovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockMovements_Persons_FromPersonId",
                        column: x => x.FromPersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_Persons_MovedById",
                        column: x => x.MovedById,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_Persons_ToPersonId",
                        column: x => x.ToPersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_Products_ProductId1",
                        column: x => x.ProductId1,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StockMovements_PurchaseItems_PurchaseItemId1",
                        column: x => x.PurchaseItemId1,
                        principalTable: "PurchaseItems",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AssetAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId1 = table.Column<string>(type: "text", nullable: true),
                    PurchaseItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    PurchaseItemId1 = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    AssignedToId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpectedReturnDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Purpose = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReturnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReturnedToId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConditionOnReturn = table.Column<int>(type: "integer", nullable: true),
                    ReturnNotes = table.Column<string>(type: "text", nullable: true),
                    StockMovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetAssignments_Persons_AssignedById",
                        column: x => x.AssignedById,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetAssignments_Persons_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetAssignments_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AssetAssignments_Persons_ReturnedToId",
                        column: x => x.ReturnedToId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetAssignments_Products_ProductId1",
                        column: x => x.ProductId1,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AssetAssignments_PurchaseItems_PurchaseItemId1",
                        column: x => x.PurchaseItemId1,
                        principalTable: "PurchaseItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AssetAssignments_StockMovements_StockMovementId",
                        column: x => x.StockMovementId,
                        principalTable: "StockMovements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssetTransfers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferNumber = table.Column<string>(type: "text", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId1 = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    FromLocation = table.Column<string>(type: "text", nullable: true),
                    FromPersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToLocation = table.Column<string>(type: "text", nullable: false),
                    ToPersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    InitiatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    AcknowledgedById = table.Column<Guid>(type: "uuid", nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StockMovementId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetTransfers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetTransfers_Persons_AcknowledgedById",
                        column: x => x.AcknowledgedById,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetTransfers_Persons_FromPersonId",
                        column: x => x.FromPersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetTransfers_Persons_InitiatedById",
                        column: x => x.InitiatedById,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetTransfers_Persons_ToPersonId",
                        column: x => x.ToPersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetTransfers_Products_ProductId1",
                        column: x => x.ProductId1,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AssetTransfers_StockMovements_StockMovementId",
                        column: x => x.StockMovementId,
                        principalTable: "StockMovements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "WriteOffs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WriteOffNumber = table.Column<string>(type: "text", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId1 = table.Column<string>(type: "text", nullable: false),
                    PurchaseItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    PurchaseItemId1 = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ConditionAtWriteOff = table.Column<int>(type: "integer", nullable: false),
                    EstimatedLossValue = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedById = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovalNotes = table.Column<string>(type: "text", nullable: true),
                    SupportingDocument = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StockMovementId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WriteOffs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WriteOffs_Persons_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Persons",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WriteOffs_Persons_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WriteOffs_Products_ProductId1",
                        column: x => x.ProductId1,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WriteOffs_PurchaseItems_PurchaseItemId1",
                        column: x => x.PurchaseItemId1,
                        principalTable: "PurchaseItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WriteOffs_StockMovements_StockMovementId",
                        column: x => x.StockMovementId,
                        principalTable: "StockMovements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_AssignedById",
                table: "AssetAssignments",
                column: "AssignedById");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_AssignedToId",
                table: "AssetAssignments",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_PersonId",
                table: "AssetAssignments",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_ProductId1",
                table: "AssetAssignments",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_PurchaseItemId1",
                table: "AssetAssignments",
                column: "PurchaseItemId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_ReturnedToId",
                table: "AssetAssignments",
                column: "ReturnedToId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetAssignments_StockMovementId",
                table: "AssetAssignments",
                column: "StockMovementId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_AcknowledgedById",
                table: "AssetTransfers",
                column: "AcknowledgedById");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_FromPersonId",
                table: "AssetTransfers",
                column: "FromPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_InitiatedById",
                table: "AssetTransfers",
                column: "InitiatedById");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_ProductId1",
                table: "AssetTransfers",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_StockMovementId",
                table: "AssetTransfers",
                column: "StockMovementId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTransfers_ToPersonId",
                table: "AssetTransfers",
                column: "ToPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_ProductId1",
                table: "MaintenanceRecords",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_TechnicianId",
                table: "MaintenanceRecords",
                column: "TechnicianId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseItems_ProductId",
                table: "PurchaseItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseItems_PurchaseId",
                table: "PurchaseItems",
                column: "PurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseItems_ResponsiblePersonId",
                table: "PurchaseItems",
                column: "ResponsiblePersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_SupplierId",
                table: "Purchases",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_FromPersonId",
                table: "StockMovements",
                column: "FromPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_MovedById",
                table: "StockMovements",
                column: "MovedById");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ProductId1",
                table: "StockMovements",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_PurchaseItemId1",
                table: "StockMovements",
                column: "PurchaseItemId1");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ToPersonId",
                table: "StockMovements",
                column: "ToPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_ApprovedById",
                table: "WriteOffs",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_ProductId1",
                table: "WriteOffs",
                column: "ProductId1");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_PurchaseItemId1",
                table: "WriteOffs",
                column: "PurchaseItemId1");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_RequestedById",
                table: "WriteOffs",
                column: "RequestedById");

            migrationBuilder.CreateIndex(
                name: "IX_WriteOffs_StockMovementId",
                table: "WriteOffs",
                column: "StockMovementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetAssignments");

            migrationBuilder.DropTable(
                name: "AssetTransfers");

            migrationBuilder.DropTable(
                name: "MaintenanceRecords");

            migrationBuilder.DropTable(
                name: "WriteOffs");

            migrationBuilder.DropTable(
                name: "StockMovements");

            migrationBuilder.DropTable(
                name: "PurchaseItems");

            migrationBuilder.DropTable(
                name: "Persons");

            migrationBuilder.DropTable(
                name: "Purchases");

            migrationBuilder.DropColumn(
                name: "AssignedQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Attributes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AvailableQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TotalQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AttributeSchema",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Categories");

            migrationBuilder.RenameColumn(
                name: "ProductName",
                table: "Products",
                newName: "VoucherNumber");

            migrationBuilder.RenameColumn(
                name: "ProductCode",
                table: "Products",
                newName: "Donor");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:hstore", ",,");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdateDate",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
