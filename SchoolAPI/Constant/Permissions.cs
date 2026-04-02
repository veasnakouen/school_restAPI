namespace SchoolAPI.Constant;

public static class Permissions
{
    public const string ClaimType = "school.permission";

    public const string UsersRead = "users.read";
    public const string UsersCreate = "users.create";
    public const string UsersUpdate = "users.update";
    public const string UsersDelete = "users.delete";

    public const string RolesRead = "roles.read";
    public const string RolesCreate = "roles.create";
    public const string RolesUpdate = "roles.update";
    public const string RolesDelete = "roles.delete";
    public const string RolesAssign = "roles.assign";

    public const string BrandRead = "brand.read";
    public const string BrandCreate = "brand.create";
    public const string BrandUpdate = "brand.update";
    public const string BrandDelete = "brand.delete";

    public const string CategoryRead = "category.read";
    public const string CategoryCreate = "category.create";
    public const string CategoryUpdate = "category.update";
    public const string CategoryDelete = "category.delete";

    public const string DepartmentRead = "department.read";
    public const string DepartmentCreate = "department.create";
    public const string DepartmentUpdate = "department.update";
    public const string DepartmentDelete = "department.delete";

    public const string DonorRead = "donor.read";
    public const string DonorCreate = "donor.create";
    public const string DonorUpdate = "donor.update";
    public const string DonorDelete = "donor.delete";

    public const string ResponserRead = "responser.read";
    public const string ResponserCreate = "responser.create";
    public const string ResponserUpdate = "responser.update";
    public const string ResponserDelete = "responser.delete";

    public const string ProductRead = "product.read";
    public const string ProductCreate = "product.create";
    public const string ProductUpdate = "product.update";
    public const string ProductDelete = "product.delete";

    public const string TransactionRead = "transaction.read";
    public const string TransactionCreate = "transaction.create";
    public const string TransactionUpdate = "transaction.update";
    public const string TransactionDelete = "transaction.delete";

    public const string ClassRead = "class.read";
    public const string ClassCreate = "class.create";
    public const string ClassUpdate = "class.update";
    public const string ClassDelete = "class.delete";

    public const string StudentRead = "student.read";
    public const string StudentCreate = "student.create";
    public const string StudentUpdate = "student.update";
    public const string StudentDelete = "student.delete";

    public const string OutreachRead = "outreach.read";
    public const string OutreachCreate = "outreach.create";
    public const string OutreachUpdate = "outreach.update";
    public const string OutreachDelete = "outreach.delete";

    public const string EnrollmentRead = "enrollment.read";
    public const string EnrollmentCreate = "enrollment.create";
    public const string EnrollmentUpdate = "enrollment.update";
    public const string EnrollmentDelete = "enrollment.delete";

    public static readonly string[] All =
    [
        UsersRead,
        UsersCreate,
        UsersUpdate,
        UsersDelete,
        RolesRead,
        RolesCreate,
        RolesUpdate,
        RolesDelete,
        RolesAssign,
        BrandRead,
        BrandCreate,
        BrandUpdate,
        BrandDelete,
        CategoryRead,
        CategoryCreate,
        CategoryUpdate,
        CategoryDelete,
        DepartmentRead,
        DepartmentCreate,
        DepartmentUpdate,
        DepartmentDelete,
        DonorRead,
        DonorCreate,
        DonorUpdate,
        DonorDelete,
        ResponserRead,
        ResponserCreate,
        ResponserUpdate,
        ResponserDelete,
        ProductRead,
        ProductCreate,
        ProductUpdate,
        ProductDelete,
        TransactionRead,
        TransactionCreate,
        TransactionUpdate,
        TransactionDelete,
        ClassRead,
        ClassCreate,
        ClassUpdate,
        ClassDelete,
        StudentRead,
        StudentCreate,
        StudentUpdate,
        StudentDelete,
        OutreachRead,
        OutreachCreate,
        OutreachUpdate,
        OutreachDelete,
        EnrollmentRead,
        EnrollmentCreate,
        EnrollmentUpdate,
        EnrollmentDelete
    ];

    public static readonly string[] MasterData =
    [
        BrandRead,
        BrandCreate,
        BrandUpdate,
        BrandDelete,
        CategoryRead,
        CategoryCreate,
        CategoryUpdate,
        CategoryDelete,
        DepartmentRead,
        DepartmentCreate,
        DepartmentUpdate,
        DepartmentDelete,
        DonorRead,
        DonorCreate,
        DonorUpdate,
        DonorDelete,
        ResponserRead,
        ResponserCreate,
        ResponserUpdate,
        ResponserDelete
    ];

    public static readonly string[] Inventory =
    [
        ProductRead,
        ProductCreate,
        ProductUpdate,
        ProductDelete,
        TransactionRead,
        TransactionCreate,
        TransactionUpdate,
        TransactionDelete
    ];

    public static readonly string[] Academics =
    [
        ClassRead,
        ClassCreate,
        ClassUpdate,
        ClassDelete,
        StudentRead,
        StudentCreate,
        StudentUpdate,
        StudentDelete,
        OutreachRead,
        OutreachCreate,
        OutreachUpdate,
        OutreachDelete,
        EnrollmentRead,
        EnrollmentCreate,
        EnrollmentUpdate,
        EnrollmentDelete
    ];

    public static string[] GetDefaultPermissionsForRole(string roleName)
    {
        return roleName switch
        {
            Roles.Admin => All,
            Roles.DataEntry => [.. MasterData, .. Inventory],
            Roles.Teacher => Academics,
            _ => []
        };
    }

    public static bool IsDefined(string permission)
    {
        return Array.Exists(All, candidate => string.Equals(candidate, permission, StringComparison.OrdinalIgnoreCase));
    }
}