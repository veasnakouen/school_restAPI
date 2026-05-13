// using MediatR;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using SchoolAPI.Application.Common.Models;
// using SchoolAPI.Application.Features.Products.Create;
// using SchoolAPI.Application.Features.Products.Update;
// using SchoolAPI.Application.Features.Products.GetAll;
// using SchoolAPI.Application.Features.Products.Delete;
// using SchoolAPI.Application.Features.Products.Image;
// using SchoolAPI.Helpers;
// using SchoolAPI.Application.Features.Products.GetById;
// using SchoolAPI.Constant;
// using SchoolAPI.Contracts;

// namespace SchoolAPI.Controllers;

// [Route("api/inventory/products")]
// [ApiController]
// public class ProductsController : BaseController
// {
//     private readonly ISender _sender;

//     public ProductsController(ISender sender)
//     {
//         _sender = sender;
//     }

//     [HttpPost]
//     [Authorize(Policy = Permissions.ProductCreate)]
//     public async Task<IActionResult> CreateProduct([FromBody] ProductDto request, CancellationToken cancellationToken)
//     {
//         var command = new CreateProductCommand(request);
//         var result = await _sender.Send(command, cancellationToken);
//         return HandleResult(result);
//     }

//     [HttpPut("{productId}")]
//     [Authorize(Policy = Permissions.ProductUpdate)]
//     public async Task<IActionResult> UpdateProduct(string productId, [FromBody] ProductDto request, CancellationToken cancellationToken)
//     {
//         var command = new UpdateProductCommand(productId, request);
//         var result = await _sender.Send(command, cancellationToken);
//         return HandleResult(result);
//     }

//     [HttpGet("{productId}")]
//     [Authorize(Policy = Permissions.ProductRead)]
//     public async Task<IActionResult> GetProductById(string productId, CancellationToken cancellationToken)
//     {
//         var query = new GetProductByIdQuery(productId);
//         var result = await _sender.Send(query, cancellationToken);
//         return HandleResult(result);
//     }

//     // [HttpGet("{productId}/purchase-history")]
//     // [Authorize(Policy = Permissions.PurchaseRead)]
//     // public async Task<IActionResult> GetProductPurchaseHistory(string productId, CancellationToken cancellationToken)
//     // {
//     //     var query = new GetProductPurchaseHistoryQuery(productId);
//     //     var result = await _sender.Send(query, cancellationToken);
//     //     return HandleResult(result);
//     // }

//     [HttpGet]
//     [Authorize(Policy = Permissions.ProductRead)]
//     [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
//     public async Task<IActionResult> GetAllProducts(
//         [FromQuery] string? name = null,
//         [FromQuery] string? categoryId = null,
//         [FromQuery] string? departmentId = null,
//         [FromQuery] string? sortBy = null, 
//         [FromQuery] bool isAscending = true, 
//         [FromQuery] int pageNumber = 1, 
//         [FromQuery] int pageSize = 10, 
//         CancellationToken cancellationToken = default)
//     {
//         var query = new GetAllProductsQuery(name, categoryId, departmentId, sortBy, isAscending, pageNumber, pageSize);
//         var result = await _sender.Send(query, cancellationToken);
//         return HandleResult(result);
//     }

//     [HttpDelete("{productId}")]
//     [Authorize(Policy = Permissions.ProductDelete)]
//     [ProducesResponseType(StatusCodes.Status200OK)]
//     [ProducesResponseType(StatusCodes.Status404NotFound)]
//     public async Task<IActionResult> DeleteProduct(string productId, CancellationToken cancellationToken)
//     {
//         var command = new DeleteProductCommand(productId);
//         var result = await _sender.Send(command, cancellationToken);
//         return HandleResult(result);
//     }

//     [HttpPost("{productId}/image")]
//     [Authorize(Policy = Permissions.ProductUpdate)]
//     [Consumes("multipart/form-data")]
//     [RequestSizeLimit(ImageValidation.MaxFileSizeBytes)]
//     [ProducesResponseType(StatusCodes.Status200OK)]
//     [ProducesResponseType(StatusCodes.Status400BadRequest)]
//     [ProducesResponseType(StatusCodes.Status404NotFound)]
//     public async Task<IActionResult> UploadProductImage(string productId, [FromForm] IFormFile file, CancellationToken cancellationToken)
//     {
//         var command = new UploadProductImageCommand(productId, file);
//         var result = await _sender.Send(command, cancellationToken);
//         return HandleResult(result);
//     }

//     [HttpDelete("{productId}/image")]
//     [Authorize(Policy = Permissions.ProductUpdate)]
//     [ProducesResponseType(StatusCodes.Status200OK)]
//     [ProducesResponseType(StatusCodes.Status404NotFound)]
//     public async Task<IActionResult> DeleteProductImage(string productId, CancellationToken cancellationToken)
//     {
//         var command = new DeleteProductImageCommand(productId);
//         var result = await _sender.Send(command, cancellationToken);
//         return HandleResult(result);
//     }
// }