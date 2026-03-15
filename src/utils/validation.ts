import Joi from 'joi';

export const loginSchema = Joi.object({
  mobileOrEmail: Joi.string().required().messages({
    'string.empty': 'Mobile number or email is required',
  }),
  password: Joi.string().required().min(6).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
});

export const registerSchema = Joi.object({
  mobile_no: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be 10 digits',
    'string.empty': 'Mobile number is required',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format',
  }),
  password: Joi.string().required().min(6).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  role: Joi.string().valid('admin', 'driver', 'vendor').required(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
});

export const milkCollectionSchema = Joi.object({
  // vendor_id: Joi.string().uuid().required(), // Commented out - using center_id only, will be set automatically
  center_id: Joi.string().uuid().required(),
  collection_date: Joi.date().required(),
  collection_time: Joi.string().valid('morning', 'evening').required(),
  milk_type: Joi.string().valid('cow', 'buffalo', 'mix_milk').required(),
  milk_weight: Joi.number().positive().required(),
  fat_percentage: Joi.number().min(0).max(100).optional(), // Made optional - not needed if rate_per_liter is provided
  snf_percentage: Joi.number().min(0).max(100).optional(), // Made optional - not needed if rate_per_liter is provided
  rate_per_liter: Joi.number().positive().optional(), // Allow direct entry of rate per liter
  can_number: Joi.string().optional(),
  can_weight_kg: Joi.number().positive().optional(),
  quality_notes: Joi.string().optional(),
});

export const driverLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().positive().optional(),
  speed: Joi.number().min(0).optional(),
  address: Joi.string().optional(),
});

export const milkPriceSchema = Joi.object({
  price_date: Joi.date().required(),
  base_price: Joi.number().positive().required(),
  base_fat: Joi.number().min(0).max(100).required(), // Base FAT percentage (e.g., 6.0 for buffalo, 3.5 for cow)
  base_snf: Joi.number().min(0).max(100).required(), // Base SNF percentage (e.g., 9.0 for buffalo, 8.5 for cow)
  fat_rate: Joi.number().required(), // Rate per 1% FAT difference (typically 5.0)
  snf_rate: Joi.number().required(), // Rate per 1% SNF difference (typically 5.0)
  bonus: Joi.number().min(0).default(0), // Bonus amount (e.g., +1 Rs)
  milk_type: Joi.string().valid('cow', 'buffalo', 'mix_milk').required(),
  notes: Joi.string().optional(),
});

export const paymentSchema = Joi.object({
  vendor_id: Joi.string().uuid().required(),
  payment_type: Joi.string().valid('monthly_milk', 'driver_salary', 'advance', 'adjustment').required(),
  payment_month: Joi.date().optional(),
  total_amount: Joi.number().positive().required(),
  advance_amount: Joi.number().min(0).optional(),
  previous_pending: Joi.number().min(0).optional(),
  deductions: Joi.number().min(0).optional(),
  final_amount: Joi.number().required(),
  payment_notes: Joi.string().optional(),
});

export const validate = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    // Skip validation for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }
    next();
  };
};

