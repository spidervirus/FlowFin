"use client";

import { useEffect } from "react";

export default function SetupWizard() {
  useEffect(() => {
    // Get user data from URL or localStorage
    const getUserData = () => {
      try {
        // First check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userDataParam = urlParams.get('userData');
        
        if (userDataParam) {
          // Decode and parse the user data
          const userData = JSON.parse(decodeURIComponent(userDataParam));
          console.log('Received user data from URL:', userData);
          
          // Store the user data in localStorage for later use
          localStorage.setItem('userData', JSON.stringify(userData));
          return userData;
        }
        
        // If not in URL, check localStorage
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          return JSON.parse(userDataStr);
        }
      } catch (err) {
        console.error('Error processing user data:', err);
      }
      
      return null;
    };
    
    // Check for error message in URL
    const checkForErrorMessage = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const errorMsg = urlParams.get('error');
        
        if (errorMsg) {
          const errorContainer = document.getElementById('error-container');
          const errorMessage = document.getElementById('error-message');
          if (errorContainer && errorMessage) {
            errorMessage.textContent = decodeURIComponent(errorMsg);
            errorContainer.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Error processing URL parameters:', err);
      }
    };
    
    // Initialize
    getUserData();
    checkForErrorMessage();
    
    // Set up event listeners
    const setupEventListeners = () => {
      const form = document.getElementById('setup-form');
      const next1Button = document.getElementById('next-1');
      const next2Button = document.getElementById('next-2');
      const back2Button = document.getElementById('back-2');
      const back3Button = document.getElementById('back-3');
      const currencySelect = document.getElementById('currency');
      
      if (next1Button) {
        next1Button.addEventListener('click', goToStep2);
      }
      
      if (next2Button) {
        next2Button.addEventListener('click', goToStep3);
      }
      
      if (back2Button) {
        back2Button.addEventListener('click', goToStep1);
      }
      
      if (back3Button) {
        back3Button.addEventListener('click', goToStep2);
      }
      
      if (form) {
        form.addEventListener('submit', handleSubmit);
      }
      
      if (currencySelect) {
        currencySelect.addEventListener('change', updateCurrencySymbol);
        // Initialize currency symbol
        updateCurrencySymbol();
      }
    };
    
    // Update currency symbol
    const updateCurrencySymbol = () => {
      const currencySelect = document.getElementById('currency') as HTMLSelectElement;
      const currencySymbol = document.getElementById('currency-symbol');
      const currencySymbol2 = document.getElementById('currency-symbol-2');
      
      if (!currencySelect || !currencySymbol || !currencySymbol2) return;
      
      const currency = currencySelect.value;
      let symbol = '$';
      
      if (currency === 'EUR') {
        symbol = '€';
      } else if (currency === 'GBP') {
        symbol = '£';
      } else if (currency === 'JPY') {
        symbol = '¥';
      } else if (currency === 'INR') {
        symbol = '₹';
      }
      
      currencySymbol.textContent = symbol;
      currencySymbol2.textContent = symbol;
    };
    
    // Show error message
    const showError = (message: string) => {
      const errorContainer = document.getElementById('error-container');
      const errorMessage = document.getElementById('error-message');
      
      if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
      }
    };
    
    // Hide error message
    const hideError = () => {
      const errorContainer = document.getElementById('error-container');
      
      if (errorContainer) {
        errorContainer.classList.add('hidden');
      }
    };
    
    // Go to step 1
    const goToStep1 = () => {
      const step1 = document.getElementById('step-1');
      const step2 = document.getElementById('step-2');
      const step3 = document.getElementById('step-3');
      const step1Content = document.getElementById('step-1-content');
      const step2Content = document.getElementById('step-2-content');
      const step3Content = document.getElementById('step-3-content');
      
      if (!step1 || !step2 || !step3 || !step1Content || !step2Content || !step3Content) return;
      
      step1.className = 'step step-active';
      step2.className = 'step step-inactive';
      step3.className = 'step step-inactive';
      step1Content.classList.remove('hidden');
      step2Content.classList.add('hidden');
      step3Content.classList.add('hidden');
    };
    
    // Go to step 2
    const goToStep2 = () => {
      const accountTypeSelect = document.getElementById('accountType') as HTMLSelectElement;
      
      if (!accountTypeSelect) return;
      
      if (!accountTypeSelect.value) {
        showError('Please select an account type');
        return;
      }
      
      hideError();
      
      const step1 = document.getElementById('step-1');
      const step2 = document.getElementById('step-2');
      const step3 = document.getElementById('step-3');
      const step1Content = document.getElementById('step-1-content');
      const step2Content = document.getElementById('step-2-content');
      const step3Content = document.getElementById('step-3-content');
      
      if (!step1 || !step2 || !step3 || !step1Content || !step2Content || !step3Content) return;
      
      step1.className = 'step step-completed';
      step2.className = 'step step-active';
      step3.className = 'step step-inactive';
      step1Content.classList.add('hidden');
      step2Content.classList.remove('hidden');
      step3Content.classList.add('hidden');
      updateCurrencySymbol();
    };
    
    // Go to step 3
    const goToStep3 = () => {
      hideError();
      
      const step1 = document.getElementById('step-1');
      const step2 = document.getElementById('step-2');
      const step3 = document.getElementById('step-3');
      const step1Content = document.getElementById('step-1-content');
      const step2Content = document.getElementById('step-2-content');
      const step3Content = document.getElementById('step-3-content');
      
      if (!step1 || !step2 || !step3 || !step1Content || !step2Content || !step3Content) return;
      
      step1.className = 'step step-completed';
      step2.className = 'step step-completed';
      step3.className = 'step step-active';
      step1Content.classList.add('hidden');
      step2Content.classList.add('hidden');
      step3Content.classList.remove('hidden');
    };
    
    // Handle form submission
    const handleSubmit = (e: Event) => {
      e.preventDefault();
      
      const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
      const accountTypeSelect = document.getElementById('accountType') as HTMLSelectElement;
      const currencySelect = document.getElementById('currency') as HTMLSelectElement;
      const initialBalanceInput = document.getElementById('initialBalance') as HTMLInputElement;
      const monthlyBudgetInput = document.getElementById('monthlyBudget') as HTMLInputElement;
      const financialGoalsTextarea = document.getElementById('financialGoals') as HTMLTextAreaElement;
      
      if (!submitButton || !accountTypeSelect || !currencySelect) return;
      
      submitButton.disabled = true;
      submitButton.textContent = 'Setting up...';
      
      try {
        // Create a simple object with the form data
        const setupData = {
          preferences: {
            currency: currencySelect.value,
            accountType: accountTypeSelect.value,
          },
          account: initialBalanceInput && initialBalanceInput.value ? {
            name: 'Primary Account',
            type: 'checking',
            balance: parseFloat(initialBalanceInput.value),
            currency: currencySelect.value,
          } : null,
          budget: monthlyBudgetInput && monthlyBudgetInput.value ? {
            name: 'Monthly Budget',
            description: 'Auto-generated monthly budget',
            amount: parseFloat(monthlyBudgetInput.value),
          } : null,
          goal: financialGoalsTextarea && financialGoalsTextarea.value ? {
            name: 'My First Goal',
            description: financialGoalsTextarea.value,
            targetAmount: 1000,
          } : null
        };
        
        // Store the setup data in localStorage
        localStorage.setItem('setupData', JSON.stringify(setupData));
        
        // Store a success message
        localStorage.setItem('setupSuccess', 'Account setup completed successfully!');
        
        // Redirect to dashboard with setupComplete parameter
        window.location.href = '/dashboard?setupComplete=true';
      } catch (error: any) {
        console.error('Error preparing setup data:', error);
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Setup';
        showError('Failed to complete setup: ' + (error.message || 'Unknown error'));
      }
    };
    
    // Set up event listeners after a short delay to ensure DOM is ready
    setTimeout(setupEventListeners, 100);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's get your financial management system set up
        </p>
      </div>

      <div id="error-container" className="mt-4 sm:mx-auto sm:w-full sm:max-w-md hidden">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span id="error-message" className="block sm:inline"></span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  id={`step-${i + 1}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i + 1 === 1
                      ? "step step-active bg-blue-600 text-white"
                      : "step step-inactive bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>
          </div>

          <form id="setup-form">
            {/* Step 1: Basic Information */}
            <div id="step-1-content">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="mb-4">
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  required
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select account type</option>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  defaultValue="USD"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  id="next-1"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Step 2: Financial Setup */}
            <div id="step-2-content" className="hidden">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Setup</h3>
              
              <div className="mb-4">
                <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700">
                  Initial Account Balance (Optional)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span id="currency-symbol" className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="initialBalance"
                    id="initialBalance"
                    className="mt-1 block w-full pl-7 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="monthlyBudget" className="block text-sm font-medium text-gray-700">
                  Monthly Budget (Optional)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span id="currency-symbol-2" className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="monthlyBudget"
                    id="monthlyBudget"
                    className="mt-1 block w-full pl-7 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  id="back-2"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="next-2"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Step 3: Financial Goals */}
            <div id="step-3-content" className="hidden">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Goals</h3>
              
              <div className="mb-4">
                <label htmlFor="financialGoals" className="block text-sm font-medium text-gray-700">
                  What are your financial goals? (Optional)
                </label>
                <textarea
                  id="financialGoals"
                  name="financialGoals"
                  rows={3}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Save for a vacation, pay off debt, build emergency fund"
                ></textarea>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  id="back-3"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  id="submit-button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}