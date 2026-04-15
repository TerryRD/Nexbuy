using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nexbuy.Models;

public class Category
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int? ParentId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; }
    public ICollection<Product> Products { get; set; }

    public Category()
    {
        SortOrder = 0;
        Children = new List<Category>();
        Products = new List<Product>();
    }
}
