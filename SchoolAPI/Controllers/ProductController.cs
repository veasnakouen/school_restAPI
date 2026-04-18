using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Products.Create;
using SchoolAPI.Application.Features.Products.Delete;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Application.Features.Products.GetById;
using SchoolAPI.Application.Features.Products.Image;
using SchoolAPI.Application.Features.Products.Update;
using SchoolAPI.Contracts;
using SchoolAPI.Helpers;

namespace SchoolAPI.Controllers;

[Route("api/inventory/products")]
[ApiController]
[Authorize(Policy = Permissions.ProductRead)]
public class ProductController : ControllerBase
{
    private readonly ISender _sender;

    public ProductController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAllProducts([FromQuery] string? filterOn = null, [FromQuery] string? filterQuery = null, [FromQuery] string? sortBy = null, [FromQuery] bool isAscending = true, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAllProductsQuery(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{productId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(string productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetProductByIdQuery(productId), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.ProductCreate)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProduct([FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateProductCommand(productDto), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetProductById), new { productId = result.Data?.Id }, result.Data);
    }

    [HttpPut("{productId}")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(string productId, [FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(productDto.Id) && !string.Equals(productId, productDto.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid product ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateProductCommand(productId, productDto), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{productId}")]
    [Authorize(Policy = Permissions.ProductDelete)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(string productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteProductCommand(productId), cancellationToken);
        return result.IsSuccess ? Ok("Product deleted successfully.") : NotFound(result.ErrorMessage);
    }

    [HttpPost("{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageValidation.MaxFileSizeBytes)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadProductImage(string productId, [FromForm] ProductImageUploadRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new UploadProductImageCommand(productId, request.File), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.ErrorMessage);
    }

    [HttpDelete("{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProductImage(string productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteProductImageCommand(productId), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }
}