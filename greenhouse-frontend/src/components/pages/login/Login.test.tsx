import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import '@testing-library/jest-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useColorMode: () => ({ colorMode: 'light', toggleColorMode: vi.fn() }),
    useColorModeValue: (light: any, dark: any) => light,
    useTheme: () => ({}),
    useStyleConfig: () => ({}),
    useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
  };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <ChakraProvider value={defaultSystem}>
        <BrowserRouter>
          <Login onLogin={mockOnLogin} />
        </BrowserRouter>
      </ChakraProvider>
    );
  };

  it('should render login form successfully', () => {
    renderLogin();
    
    expect(screen.getByText('Welcome to Via GreenHouse')).toBeInTheDocument();
    expect(screen.getByText('Username *')).toBeInTheDocument();
    expect(screen.getByText('Password *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should redirect to dashboard after successful login', async () => {
    const mockResponse = {
      token: 'test-token',
      user: {
        id: 1,
        username: 'eser',
        firstName: 'Eser',
        lastName: 'Sariyar',
        refCode: 'HTHCTGB8'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    renderLogin();

    // Get inputs by type
    const usernameInput = screen.getByRole('textbox');
    const passwordInput = screen.queryByTestId('password-input') || 
                         document.querySelector('input[type="password"]') as HTMLElement;

    fireEvent.change(usernameInput, {
      target: { value: 'eser' }
    });
    fireEvent.change(passwordInput, {
      target: { value: 'eser123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            username: 'eser',
            password: 'eser123'
          })
        })
      );
    });

    expect(mockOnLogin).toHaveBeenCalledWith(mockResponse.token, mockResponse.user);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should show error message with invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    });

    renderLogin();

    // Get inputs by type
    const usernameInput = screen.getByRole('textbox');
    const passwordInput = screen.queryByTestId('password-input') || 
                         document.querySelector('input[type="password"]') as HTMLElement;

    fireEvent.change(usernameInput, {
      target: { value: 'wronguser' }
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpass' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/username and password are required|invalid credentials/i)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show error message on empty form submission', async () => {
    renderLogin();

    // Submit form without entering any data
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      const errorBox = screen.getByRole('alert') || document.querySelector('.chakra-box');
      expect(errorBox).toHaveTextContent('Username and password are required');
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should be able to switch to registration form', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText('Join Via GreenHouse')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password *')).toBeInTheDocument();
    expect(screen.getByText('Invitation Code *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show error when passwords do not match in registration form', async () => {
    renderLogin();

    // Switch to registration form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Get username input and password inputs
    const textInputs = screen.getAllByRole('textbox');
    const usernameInput = textInputs[0];
    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const passwordInput = passwordInputs[0] as HTMLElement;
    const confirmPasswordInput = passwordInputs[1] as HTMLElement;
    const inviteCodeInput = textInputs[textInputs.length - 1];

    fireEvent.change(usernameInput, {
      target: { value: 'newuser' }
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' }
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'differentpass' }
    });
    fireEvent.change(inviteCodeInput, {
      target: { value: 'INVITE123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // The DOM shows "Passwords do not match" error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
}); 