import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Helper to generate URL-safe slug
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

// @desc    Get all categories (active ones by default, or all if includeInactive=true)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };

    const categories = await Category.find(query).sort({ name: 1 });

    // Optionally attach active product counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          categoryId: cat._id,
          isPublished: true,
          isActive: true
        });
        return {
          ...cat.toObject(),
          productCount
        };
      })
    );

    res.json({
      success: true,
      count: categoriesWithCounts.length,
      categories: categoriesWithCounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get category details by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const productCount = await Product.countDocuments({
      categoryId: category._id,
      isPublished: true,
      isActive: true
    });

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, image, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name or slug already exists.'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      icon: icon || 'ShoppingBag',
      image: image || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, image, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    if (name) {
      category.name = name.trim();
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description.trim();
    if (icon) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category with safe orphan protection
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    // SAFE ORPHAN CHECK: Check if any products use this category
    const productsCount = await Product.countDocuments({ categoryId: category._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productsCount} active products are currently assigned to it. Deactivate the category instead or reassign the products first.`
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
