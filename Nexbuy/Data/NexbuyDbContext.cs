using Microsoft.EntityFrameworkCore;
using Nexbuy.Models;
using Nexbuy.Models.Enums;

namespace Nexbuy.Data;

public class NexbuyDbContext : DbContext
{
    public NexbuyDbContext(DbContextOptions<NexbuyDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductTranslation> ProductTranslations => Set<ProductTranslation>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<DigitalDownload> DigitalDownloads => Set<DigitalDownload>();
    public DbSet<Point> Points => Set<Point>();
    public DbSet<PointRule> PointRules => Set<PointRule>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<OrderCoupon> OrderCoupons => Set<OrderCoupon>();
    public DbSet<ShippingMethod> ShippingMethods => Set<ShippingMethod>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // ── UserAddress ───────────────────────────────────────
        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Addresses)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Admin ─────────────────────────────────────────────
        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // ── Category (self-referencing) ───────────────────────
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();

            entity.HasOne(e => e.Parent)
                  .WithMany(e => e.Children)
                  .HasForeignKey(e => e.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Product ───────────────────────────────────────────
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.SKU).IsUnique();

            entity.Property(e => e.Price).HasPrecision(10, 2);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── ProductTranslation ────────────────────────────────
        modelBuilder.Entity<ProductTranslation>(entity =>
        {
            entity.HasIndex(e => new { e.ProductId, e.Locale }).IsUnique();

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Translations)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ProductImage ──────────────────────────────────────
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Images)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ProductVariant ────────────────────────────────────
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.Property(e => e.PriceAdjustment).HasPrecision(10, 2);

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Order ─────────────────────────────────────────────
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(e => e.OrderNo).IsUnique();

            entity.Property(e => e.ShippingFee).HasPrecision(10, 2);
            entity.Property(e => e.SubTotal).HasPrecision(10, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(10, 2);
            entity.Property(e => e.PointDiscount).HasPrecision(10, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(10, 2);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Orders)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── OrderItem ─────────────────────────────────────────
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
            entity.Property(e => e.Subtotal).HasPrecision(10, 2);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.Items)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Variant)
                  .WithMany()
                  .HasForeignKey(e => e.VariantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── DigitalDownload ───────────────────────────────────
        modelBuilder.Entity<DigitalDownload>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();

            entity.HasOne(e => e.OrderItem)
                  .WithMany()
                  .HasForeignKey(e => e.OrderItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.DigitalDownloads)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Point ─────────────────────────────────────────────
        modelBuilder.Entity<Point>(entity =>
        {
            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Points)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Order)
                  .WithMany()
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── PointRule ─────────────────────────────────────────
        modelBuilder.Entity<PointRule>(entity =>
        {
            entity.Property(e => e.EarnRate).HasPrecision(10, 4);
            entity.Property(e => e.RedeemRate).HasPrecision(10, 4);

            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // ── Coupon ────────────────────────────────────────────
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();

            entity.Property(e => e.Value).HasPrecision(10, 2);
            entity.Property(e => e.MinOrderAmount).HasPrecision(10, 2);
        });

        // ── OrderCoupon ───────────────────────────────────────
        modelBuilder.Entity<OrderCoupon>(entity =>
        {
            entity.Property(e => e.DiscountAmount).HasPrecision(10, 2);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderCoupons)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Coupon)
                  .WithMany(c => c.OrderCoupons)
                  .HasForeignKey(e => e.CouponId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── ShippingMethod ────────────────────────────────────
        modelBuilder.Entity<ShippingMethod>(entity =>
        {
            entity.Property(e => e.BaseFee).HasPrecision(10, 2);
            entity.Property(e => e.FreeShippingThreshold).HasPrecision(10, 2);
        });

        // ── Wishlist ──────────────────────────────────────────
        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.ProductId }).IsUnique();

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Wishlists)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Wishlists)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
