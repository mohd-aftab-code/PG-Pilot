import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { setStoredUser } from '../../utils/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'pg_admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await api.post('/api/auth/signup', signupData);
      
      console.log('Signup response:', response.data);

      if (response.data && response.data.user) {
        setStoredUser(response.data.user);
        const user = response.data.user;
        
        // Small delay to ensure state is saved
        setTimeout(() => {
          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs'); // Superadmin goes to PG management
          } else {
            // PG Admin must subscribe first - redirect to landing page
            navigate('/', { state: { message: 'Please subscribe to a plan to continue' } });
          }
        }, 100);
      } else {
        setError(response.data?.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Signup failed. Please try again.';
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="bg-card p-8 rounded shadow-lg w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">PG</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">PG Pilot</h1>
          <h2 className="text-lg font-medium text-muted-foreground">Create your account</h2>
        </div>
        
        <form onSubmit={handleSignup}>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            >
              <option value="pg_admin">PG Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-foreground text-sm font-bold mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="mt-4 text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-accent">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

