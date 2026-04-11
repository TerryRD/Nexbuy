using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminProductService : IAdminProductService
{
    private readonly NexbuyDbContext _db;
    private readonly IWebHostEnvironment _env;

    public AdminProductService(NexbuyDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(int page, int pageSize, string? search, byte? status)
    {
        var query = _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Category)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(p => (byte)p.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(p =>
                p.SKU.Contains(keyword) ||
                p.Translations.Any(t => t.Name.Contains(keyword)));
        }

        var projected = query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductListItemDto
            {
                Id = p.Id,
                Name = p.Translations.Select(t => t.Name).FirstOrDefault() ?? p.SKU,
                Price = p.Price,
                ImageUrl = p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                Type = (byte)p.Type,
                Stock = p.Stock,
                CategorySlug = p.Category.Slug
            });

        return await projected.ToPagedResultAsync(page, pageSize);
    }

    public async Task<ProductDetailDto> CreateProductAsync(AdminProductRequest request)
    {
        var product = new Product
        {
            SKU = request.SKU,
            Type = (ProductType)request.Type,
            Price = request.Price,
            Stock = request.Stock,
            MaxDownloads = request.MaxDownloads,
            DownloadExpiryHours = request.DownloadExpiryHours,
            CategoryId = request.CategoryId ?? throw new BusinessException("CategoryId is required.", "CATEGORY_REQUIRED"),
            Status = (ProductStatus)request.Status
        };

        foreach (var t in request.Translations)
        {
            product.Translations.Add(new ProductTranslation
            {
                ProductId = product.Id,
                Locale = t.Locale,
                Name = t.Name,
                Description = t.Description
            });
        }

        foreach (var v in request.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                ProductId = product.Id,
                VariantName = v.VariantName,
                PriceAdjustment = v.PriceAdjustment,
                Stock = v.Stock,
                SKU = v.SKU
            });
        }

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return await GetProductDetailInternalAsync(product.Id);
    }

    public async Task<ProductDetailDto> UpdateProductAsync(Guid id, AdminProductRequest request)
    {
        var product = await _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        product.SKU = request.SKU;
        product.Type = (ProductType)request.Type;
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.MaxDownloads = request.MaxDownloads;
        product.DownloadExpiryHours = request.DownloadExpiryHours;
        product.CategoryId = request.CategoryId ?? product.CategoryId;
        product.Status = (ProductStatus)request.Status;
        product.UpdatedAt = DateTime.UtcNow;

        // Re-create translations
        _db.ProductTranslations.RemoveRange(product.Translations);
        foreach (var t in request.Translations)
        {
            _db.ProductTranslations.Add(new ProductTranslation
            {
                ProductId = product.Id,
                Locale = t.Locale,
                Name = t.Name,
                Description = t.Description
            });
        }

        // Re-create variants
        _db.ProductVariants.RemoveRange(product.Variants);
        foreach (var v in request.Variants)
        {
            _db.ProductVariants.Add(new ProductVariant
            {
                ProductId = product.Id,
                VariantName = v.VariantName,
                PriceAdjustment = v.PriceAdjustment,
                Stock = v.Stock,
                SKU = v.SKU
            });
        }

        await _db.SaveChangesAsync();

        return await GetProductDetailInternalAsync(product.Id);
    }

    public async Task DeleteProductAsync(Guid id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        product.Status = ProductStatus.Inactive;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<ImageDto> UploadImageAsync(Guid productId, IFormFile file)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        if (!allowedExtensions.Contains(ext))
            throw new BusinessException("Invalid image format.", "INVALID_IMAGE_FORMAT");

        var fileName = $"{Guid.NewGuid()}{ext}";
        var relativePath = Path.Combine("uploads", "products", productId.ToString(), fileName);
        var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var absolutePath = Path.Combine(webRootPath, relativePath);

        var directory = Path.GetDirectoryName(absolutePath)!;
        if (!Directory.Exists(directory))
            Directory.CreateDirectory(directory);

        await using var stream = new FileStream(absolutePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var maxSortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync() ?? -1;

        var image = new ProductImage
        {
            ProductId = productId,
            Url = $"/{relativePath.Replace("\\", "/")}",
            SortOrder = maxSortOrder + 1
        };

        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync();

        return new ImageDto
        {
            Id = image.Id,
            Url = image.Url,
            SortOrder = image.SortOrder
        };
    }

    public async Task DeleteImageAsync(Guid productId, Guid imageId)
    {
        var image = await _db.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId);

        if (image == null)
            throw new BusinessException("Image not found.", "IMAGE_NOT_FOUND", 404);

        var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var filePath = Path.Combine(webRootPath, image.Url.TrimStart('/'));
        if (File.Exists(filePath))
            File.Delete(filePath);

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync();
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _db.Categories
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Slug = c.Slug,
            SortOrder = c.SortOrder,
            Name = c.Slug,
            Children = new List<CategoryDto>()
        }).ToList();
    }

    public async Task<CategoryDto> CreateCategoryAsync(CategoryDto request)
    {
        var exists = await _db.Categories.AnyAsync(c => c.Slug == request.Slug);
        if (exists)
            throw new BusinessException("Category slug already exists.", "CATEGORY_SLUG_EXISTS");

        var category = new Category
        {
            Slug = request.Slug,
            SortOrder = request.SortOrder
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Slug = category.Slug,
            SortOrder = category.SortOrder,
            Name = category.Slug,
            Children = new List<CategoryDto>()
        };
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, CategoryDto request)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null)
            throw new BusinessException("Category not found.", "CATEGORY_NOT_FOUND", 404);

        if (category.Slug != request.Slug)
        {
            var slugExists = await _db.Categories.AnyAsync(c => c.Slug == request.Slug && c.Id != id);
            if (slugExists)
                throw new BusinessException("Category slug already exists.", "CATEGORY_SLUG_EXISTS");
        }

        category.Slug = request.Slug;
        category.SortOrder = request.SortOrder;
        await _db.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Slug = category.Slug,
            SortOrder = category.SortOrder,
            Name = category.Slug,
            Children = new List<CategoryDto>()
        };
    }

    public async Task DeleteCategoryAsync(int id)
    {
        var category = await _db.Categories
            .Include(c => c.Products)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new BusinessException("Category not found.", "CATEGORY_NOT_FOUND", 404);

        if (category.Products.Any())
            throw new BusinessException("Cannot delete category with products.", "CATEGORY_HAS_PRODUCTS");

        if (category.Children.Any())
            throw new BusinessException("Cannot delete category with subcategories.", "CATEGORY_HAS_CHILDREN");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    private async Task<ProductDetailDto> GetProductDetailInternalAsync(Guid id)
    {
        var product = await _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstAsync(p => p.Id == id);

        return new ProductDetailDto
        {
            Id = product.Id,
            SKU = product.SKU,
            Type = (byte)product.Type,
            Price = product.Price,
            Stock = product.Stock,
            MaxDownloads = product.MaxDownloads,
            DownloadExpiryHours = product.DownloadExpiryHours,
            Status = (byte)product.Status,
            CategoryId = product.CategoryId,
            Translations = product.Translations.Select(t => new TranslationDto
            {
                Locale = t.Locale,
                Name = t.Name,
                Description = t.Description
            }).ToList(),
            Images = product.Images.OrderBy(i => i.SortOrder).Select(i => new ImageDto
            {
                Id = i.Id,
                Url = i.Url,
                SortOrder = i.SortOrder
            }).ToList(),
            Variants = product.Variants.Select(v => new VariantDto
            {
                Id = v.Id,
                VariantName = v.VariantName,
                PriceAdjustment = v.PriceAdjustment,
                Stock = v.Stock,
                SKU = v.SKU
            }).ToList()
        };
    }
}
