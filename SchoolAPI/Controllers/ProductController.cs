using MediatR;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Products.Create;
using SchoolAPI.Application.Features.Products.Delete;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Application.Features.Products.GetById;
using SchoolAPI.Application.Features.Products.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/products")]
[ApiController]
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
    public async Task<IActionResult> GetAllProducts(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllProductsQuery(), cancellationToken);
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(string productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteProductCommand(productId), cancellationToken);
        return result.IsSuccess ? Ok("Product deleted successfully.") : NotFound(result.ErrorMessage);
    }
}