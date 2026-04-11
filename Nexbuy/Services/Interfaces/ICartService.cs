using Nexbuy.DTOs.Cart;

namespace Nexbuy.Services.Interfaces;

public interface ICartService
{
    Task<CartDto> GetCartAsync(string cartId);
    Task<CartDto> AddItemAsync(string cartId, AddToCartRequest request);
    Task<CartDto> UpdateItemAsync(string cartId, string itemId, UpdateCartItemRequest request);
    Task<CartDto> RemoveItemAsync(string cartId, string itemId);
    Task<CartDto> MergeCartAsync(string userId, MergeCartRequest request);
    Task<CartDto> ApplyCouponAsync(string cartId, ApplyCouponRequest request);
    Task<CartDto> RemoveCouponAsync(string cartId);
}
