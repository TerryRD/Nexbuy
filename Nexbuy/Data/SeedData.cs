using Microsoft.EntityFrameworkCore;
using Nexbuy.Models;
using Nexbuy.Models.Enums;

namespace Nexbuy.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<NexbuyDbContext>();

        await context.Database.EnsureCreatedAsync();

        await SeedAdminsAsync(context);
        await SeedPointRulesAsync(context);
        await SeedCategoriesAsync(context);
        await SeedProductsAsync(context);
        await SeedShippingMethodsAsync(context);
        await SeedCouponsAsync(context);
    }

    private static async Task SeedAdminsAsync(NexbuyDbContext context)
    {
        if (await context.Admins.AnyAsync()) return;

        context.Admins.Add(new Admin
        {
            Email = "admin@nexbuy.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Name = "系統管理員",
            Role = AdminRole.SuperAdmin,
            Status = UserStatus.Active
        });

        await context.SaveChangesAsync();
    }

    private static async Task SeedPointRulesAsync(NexbuyDbContext context)
    {
        if (await context.PointRules.AnyAsync()) return;

        context.PointRules.Add(new PointRule
        {
            EarnRate = 0.01m,
            RedeemRate = 1.0m,
            PointExpiryMonths = 12
        });

        await context.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAsync(NexbuyDbContext context)
    {
        if (await context.Categories.AnyAsync()) return;

        // Root categories
        var electronics = new Category { Slug = "electronics", SortOrder = 1 };
        var clothing = new Category { Slug = "clothing", SortOrder = 2 };
        var digitalGoods = new Category { Slug = "digital-goods", SortOrder = 3 };

        context.Categories.AddRange(electronics, clothing, digitalGoods);
        await context.SaveChangesAsync();

        // Sub-categories for electronics
        var phones = new Category { ParentId = electronics.Id, Slug = "phones", SortOrder = 1 };
        var laptops = new Category { ParentId = electronics.Id, Slug = "laptops", SortOrder = 2 };

        // Sub-categories for clothing
        var tops = new Category { ParentId = clothing.Id, Slug = "tops", SortOrder = 1 };
        var pants = new Category { ParentId = clothing.Id, Slug = "pants", SortOrder = 2 };

        context.Categories.AddRange(phones, laptops, tops, pants);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(NexbuyDbContext context)
    {
        if (await context.Products.AnyAsync()) return;

        var phones = await context.Categories.FirstAsync(c => c.Slug == "phones");
        var laptops = await context.Categories.FirstAsync(c => c.Slug == "laptops");
        var tops = await context.Categories.FirstAsync(c => c.Slug == "tops");
        var pants = await context.Categories.FirstAsync(c => c.Slug == "pants");
        var digitalGoods = await context.Categories.FirstAsync(c => c.Slug == "digital-goods");

        // ── Product 1: Smartphone ─────────────────────────────
        var phone1 = new Product
        {
            CategoryId = phones.Id,
            SKU = "PHONE-001",
            Type = ProductType.Physical,
            Price = 25900m,
            Stock = 50,
            Status = ProductStatus.Active
        };

        // ── Product 2: Laptop ─────────────────────────────────
        var laptop1 = new Product
        {
            CategoryId = laptops.Id,
            SKU = "LAPTOP-001",
            Type = ProductType.Physical,
            Price = 42900m,
            Stock = 30,
            Status = ProductStatus.Active
        };

        // ── Product 3: T-Shirt ────────────────────────────────
        var tshirt1 = new Product
        {
            CategoryId = tops.Id,
            SKU = "TOP-001",
            Type = ProductType.Physical,
            Price = 590m,
            Stock = 200,
            Status = ProductStatus.Active
        };

        // ── Product 4: Jeans ──────────────────────────────────
        var jeans1 = new Product
        {
            CategoryId = pants.Id,
            SKU = "PANT-001",
            Type = ProductType.Physical,
            Price = 1290m,
            Stock = 100,
            Status = ProductStatus.Active
        };

        // ── Product 5: Wireless Earbuds ───────────────────────
        var earbuds1 = new Product
        {
            CategoryId = phones.Id,
            SKU = "PHONE-002",
            Type = ProductType.Physical,
            Price = 3490m,
            Stock = 80,
            Status = ProductStatus.Active
        };

        // ── Product 6: Digital Course ─────────────────────────
        var course1 = new Product
        {
            CategoryId = digitalGoods.Id,
            SKU = "DIG-001",
            Type = ProductType.Digital,
            Price = 1990m,
            Stock = 999,
            MaxDownloads = 5,
            DownloadExpiryHours = 720,
            Status = ProductStatus.Active
        };

        context.Products.AddRange(phone1, laptop1, tshirt1, jeans1, earbuds1, course1);
        await context.SaveChangesAsync();

        // ── Translations ──────────────────────────────────────
        var translations = new List<ProductTranslation>
        {
            // Phone
            new() { ProductId = phone1.Id, Locale = "zh-TW", Name = "旗艦智慧型手機 Pro", Description = "最新旗艦手機，搭載頂級處理器與 AMOLED 螢幕" },
            new() { ProductId = phone1.Id, Locale = "en", Name = "Flagship Smartphone Pro", Description = "Latest flagship phone with top-tier processor and AMOLED display" },
            new() { ProductId = phone1.Id, Locale = "ja", Name = "フラッグシップスマートフォン Pro", Description = "最新フラッグシップ、最高級プロセッサとAMOLEDディスプレイ搭載" },

            // Laptop
            new() { ProductId = laptop1.Id, Locale = "zh-TW", Name = "輕薄筆記型電腦 14 吋", Description = "超輕薄設計，14 吋 2K 螢幕，續航力長達 12 小時" },
            new() { ProductId = laptop1.Id, Locale = "en", Name = "Ultra-thin Laptop 14\"", Description = "Ultra-thin design, 14-inch 2K display, up to 12 hours battery life" },
            new() { ProductId = laptop1.Id, Locale = "ja", Name = "超薄型ノートパソコン 14インチ", Description = "超薄型デザイン、14インチ2Kディスプレイ、最大12時間バッテリー" },

            // T-Shirt
            new() { ProductId = tshirt1.Id, Locale = "zh-TW", Name = "經典純棉圓領T恤", Description = "100% 純棉材質，舒適透氣，多色可選" },
            new() { ProductId = tshirt1.Id, Locale = "en", Name = "Classic Cotton Crew Neck T-Shirt", Description = "100% cotton, comfortable and breathable, available in multiple colors" },
            new() { ProductId = tshirt1.Id, Locale = "ja", Name = "クラシックコットンクルーネックTシャツ", Description = "100%コットン素材、快適で通気性抜群、多色展開" },

            // Jeans
            new() { ProductId = jeans1.Id, Locale = "zh-TW", Name = "修身直筒牛仔褲", Description = "彈性丹寧布料，修身剪裁，經典百搭" },
            new() { ProductId = jeans1.Id, Locale = "en", Name = "Slim Straight Jeans", Description = "Stretch denim fabric, slim fit, classic and versatile" },
            new() { ProductId = jeans1.Id, Locale = "ja", Name = "スリムストレートジーンズ", Description = "ストレッチデニム素材、スリムフィット、定番で合わせやすい" },

            // Earbuds
            new() { ProductId = earbuds1.Id, Locale = "zh-TW", Name = "真無線藍牙耳機", Description = "主動降噪，IPX5 防水，續航 30 小時" },
            new() { ProductId = earbuds1.Id, Locale = "en", Name = "True Wireless Bluetooth Earbuds", Description = "Active noise cancellation, IPX5 waterproof, 30-hour battery life" },
            new() { ProductId = earbuds1.Id, Locale = "ja", Name = "完全ワイヤレスBluetoothイヤホン", Description = "アクティブノイズキャンセリング、IPX5防水、30時間バッテリー" },

            // Digital Course
            new() { ProductId = course1.Id, Locale = "zh-TW", Name = "Python 程式設計入門課程", Description = "從零開始學 Python，包含實戰專案與練習題" },
            new() { ProductId = course1.Id, Locale = "en", Name = "Python Programming Beginner Course", Description = "Learn Python from scratch with hands-on projects and exercises" },
            new() { ProductId = course1.Id, Locale = "ja", Name = "Python プログラミング入門コース", Description = "ゼロから学ぶPython、実践プロジェクトと演習問題付き" }
        };

        context.ProductTranslations.AddRange(translations);

        // ── Images ────────────────────────────────────────────
        var images = new List<ProductImage>
        {
            new() { ProductId = phone1.Id, Url = "/images/products/phone-001-1.svg", SortOrder = 1 },
            new() { ProductId = phone1.Id, Url = "/images/products/phone-001-2.svg", SortOrder = 2 },
            new() { ProductId = laptop1.Id, Url = "/images/products/laptop-001-1.svg", SortOrder = 1 },
            new() { ProductId = laptop1.Id, Url = "/images/products/laptop-001-2.svg", SortOrder = 2 },
            new() { ProductId = tshirt1.Id, Url = "/images/products/top-001-1.svg", SortOrder = 1 },
            new() { ProductId = jeans1.Id, Url = "/images/products/pant-001-1.svg", SortOrder = 1 },
            new() { ProductId = earbuds1.Id, Url = "/images/products/phone-002-1.svg", SortOrder = 1 },
            new() { ProductId = course1.Id, Url = "/images/products/dig-001-1.svg", SortOrder = 1 }
        };

        context.ProductImages.AddRange(images);
        await context.SaveChangesAsync();
    }

    private static async Task SeedShippingMethodsAsync(NexbuyDbContext context)
    {
        if (await context.ShippingMethods.AnyAsync()) return;

        context.ShippingMethods.AddRange(
            new ShippingMethod
            {
                Name = "宅配",
                Type = ShippingMethodType.HomeDelivery,
                BaseFee = 100m,
                FreeShippingThreshold = 1500m,
                IsActive = true
            },
            new ShippingMethod
            {
                Name = "7-11超商取貨",
                Type = ShippingMethodType.SevenEleven,
                BaseFee = 60m,
                FreeShippingThreshold = 1000m,
                IsActive = true
            },
            new ShippingMethod
            {
                Name = "全家超商取貨",
                Type = ShippingMethodType.FamilyMart,
                BaseFee = 60m,
                FreeShippingThreshold = 1000m,
                IsActive = true
            }
        );

        await context.SaveChangesAsync();
    }

    private static async Task SeedCouponsAsync(NexbuyDbContext context)
    {
        if (await context.Coupons.AnyAsync()) return;

        var now = DateTime.UtcNow;

        context.Coupons.AddRange(
            new Coupon
            {
                Code = "WELCOME10",
                Type = CouponType.Percentage,
                Value = 10m,
                MinOrderAmount = 500m,
                UsageLimit = 1000,
                UsedCount = 0,
                StartAt = now,
                ExpiredAt = now.AddMonths(6),
                Status = CouponStatus.Active
            },
            new Coupon
            {
                Code = "SAVE100",
                Type = CouponType.FixedAmount,
                Value = 100m,
                MinOrderAmount = 1000m,
                UsageLimit = 500,
                UsedCount = 0,
                StartAt = now,
                ExpiredAt = now.AddMonths(3),
                Status = CouponStatus.Active
            }
        );

        await context.SaveChangesAsync();
    }
}
