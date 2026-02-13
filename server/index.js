import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ==================== CONFIGURATION ====================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform';

// ==================== MIDDLEWARE ====================
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:3000','https://sathcademy.prasath.in'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ==================== DATABASE CONNECTION ====================
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ==================== DATABASE MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  enrolledClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Class Schema
const classSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  type: { type: String, enum: ['live', 'recorded'], required: true },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: 'https://via.placeholder.com/300x200' },
  duration: { type: String, required: true },
  schedule: { 
    type: Date, 
    required: function() { return this.type === 'live'; } 
  },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  category: { type: String, required: true }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);

// ==================== MIDDLEWARE FUNCTIONS ====================

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: 'student'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/health',(req,res)=>{
  res.send("Fine👍")
});
// Login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLASS ROUTES ====================

// Get all classes (with filters)
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = { isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(query)
      .select('-enrolledStudents')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class stats for dashboard
app.get('/api/classes/stats', authenticateToken, async (req, res) => {
  try {
    const totalClasses = await Class.countDocuments({ isActive: true });
    const liveClasses = await Class.countDocuments({ type: 'live', isActive: true });
    const recordedClasses = await Class.countDocuments({ type: 'recorded', isActive: true });
    
    const user = await User.findById(req.user.userId);
    const enrolledClasses = user.enrolledClasses.length;

    const totalViews = await Class.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      totalClasses,
      liveClasses,
      recordedClasses,
      enrolledClasses,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single class
app.get('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Increment views
    classItem.views += 1;
    await classItem.save();

    res.json(classItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in class
app.post('/api/classes/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!classItem.enrolledStudents.includes(req.user.userId)) {
      classItem.enrolledStudents.push(req.user.userId);
      await classItem.save();
      
      user.enrolledClasses.push(req.params.id);
      await user.save();
    }

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's enrolled classes
app.get('/api/user/classes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('enrolledClasses');
    res.json(user.enrolledClasses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin dashboard stats
app.get('/api/admin/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalClasses = await Class.countDocuments();
    const liveClasses = await Class.countDocuments({ type: 'live', isActive: true });
    
    const totalViews = await Class.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    const popularClasses = await Class.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views enrolledStudents');

    const categoryStats = await Class.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalClasses,
        liveClasses,
        totalViews: totalViews[0]?.total || 0
      },
      recentUsers,
      popularClasses,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes (admin)
app.get('/api/admin/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create class
app.post('/api/admin/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const classData = req.body;
    const newClass = new Class(classData);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update class
app.put('/api/admin/classes/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete class
app.delete('/api/admin/classes/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin user (first-time setup)
app.post('/api/admin/setup', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const { email, password, name } = req.body;
    
    const admin = new User({
      email,
      password,
      name,
      role: 'admin'
    });

    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);
});

export default app;