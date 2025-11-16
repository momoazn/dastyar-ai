#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Authentication API Test Script");
console.log("===========================================");
console.log("");

let authToken = "";
let userId = "";

// Test 1: Health Check
console.log("1. Testing health endpoint...");
try {
  const healthResponse = await fetch(`${API_URL}/health`);
  const healthData = await healthResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(healthData, null, 2));

  if (healthResponse.ok) {
    console.log("✓ Health endpoint passed");
  } else {
    console.log("✗ Health endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Health endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 2: User Registration
console.log("2. Testing user registration...");
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: "testPassword123!",
  name: "Test User",
};

try {
  const registerResponse = await fetch(`${API_URL}/rpc/auth.register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testUser),
  });
  const registerData = await registerResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(registerData, null, 2));

  if (registerResponse.ok && registerData.data) {
    userId = registerData.data.user.id;
    console.log("✓ User registration passed");
  } else {
    console.log("✗ User registration failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User registration failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: User Login
console.log("3. Testing user login...");
try {
  const loginResponse = await fetch(`${API_URL}/rpc/auth.login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });
  const loginData = await loginResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(loginData, null, 2));

  if (loginResponse.ok && loginData.data && loginData.data.token) {
    authToken = loginData.data.token;
    console.log("✓ User login passed");
  } else {
    console.log("✗ User login failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User login failed:", error);
  process.exit(1);
}

console.log("");

// Test 4: Get Current User
console.log("4. Testing current user retrieval...");
try {
  const userResponse = await fetch(`${API_URL}/rpc/auth.me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const userData = await userResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(userData, null, 2));

  if (userResponse.ok && userData.data && userData.data.id === userId) {
    console.log("✓ Current user retrieval passed");
  } else {
    console.log("✗ Current user retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Current user retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: Update User Profile
console.log("5. Testing user profile update...");
try {
  const updateResponse = await fetch(`${API_URL}/rpc/auth.update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: "Updated Test User",
    }),
  });
  const updateData = await updateResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(updateData, null, 2));

  if (updateResponse.ok && updateData.data) {
    console.log("✓ User profile update passed");
  } else {
    console.log("✗ User profile update failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User profile update failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Change Password
console.log("6. Testing password change...");
try {
  const changePasswordResponse = await fetch(
    `${API_URL}/rpc/auth.changePassword`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        currentPassword: testUser.password,
        newPassword: "newPassword123!",
      }),
    }
  );
  const changePasswordData = await changePasswordResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(changePasswordData, null, 2));

  if (changePasswordResponse.ok) {
    console.log("✓ Password change passed");
  } else {
    console.log("✗ Password change failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Password change failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Logout
console.log("7. Testing user logout...");
try {
  const logoutResponse = await fetch(`${API_URL}/rpc/auth.logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const logoutData = await logoutResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(logoutData, null, 2));

  if (logoutResponse.ok) {
    console.log("✓ User logout passed");
  } else {
    console.log("✗ User logout failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User logout failed:", error);
  process.exit(1);
}

console.log("");

// Test 8: Login with new password
console.log("8. Testing login with new password...");
try {
  const newLoginResponse = await fetch(`${API_URL}/rpc/auth.login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testUser.email,
      password: "newPassword123!",
    }),
  });
  const newLoginData = await newLoginResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(newLoginData, null, 2));

  if (newLoginResponse.ok && newLoginData.data && newLoginData.data.token) {
    console.log("✓ Login with new password passed");
  } else {
    console.log("✗ Login with new password failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Login with new password failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All authentication API tests completed successfully!");
console.log("===========================================");
