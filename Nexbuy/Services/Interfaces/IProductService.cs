using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;

namespace Nexbuy.Services.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductListRequest request);
    Task<ProductDetailDto> GetProductByIdAsync(Guid id, string locale);
    Task<PagedResult<ProductListItemDto>> SearchProductsAsync(string query, int page, int pageSize, string locale);
    Task<List<CategoryDto>> GetCategoriesAsync(string locale);
    Task<PagedResult<ProductListItemDto>> GetCategoryProductsAsync(int categoryId, int page, int pageSize, string locale);
}
