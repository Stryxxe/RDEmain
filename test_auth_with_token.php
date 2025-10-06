<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

echo "Testing authentication with token:\n";

// Get a proponent user
$user = User::where('email', 'sarah.johnson@usep.edu.ph')->with('role')->first();

if ($user) {
    echo "User found: " . $user->email . "\n";
    echo "Role: " . $user->role->userRole . "\n";
    
    // Create a token for the user
    $token = $user->createToken('test-token');
    echo "Token created: " . $token->plainTextToken . "\n";
    
    // Test token validation
    $tokenModel = PersonalAccessToken::findToken($token->plainTextToken);
    if ($tokenModel) {
        echo "Token found in database\n";
        $tokenUser = $tokenModel->tokenable;
        echo "Token user: " . $tokenUser->email . "\n";
        echo "Token user role: " . $tokenUser->role->userRole . "\n";
        
        // Test the role check
        $canSubmit = $tokenUser->role && $tokenUser->role->userRole === 'Proponent';
        echo "Can submit proposals: " . ($canSubmit ? 'Yes' : 'No') . "\n";
        
        // Test API call with this token
        $url = 'http://localhost:8000/api/proposals';
        $headers = [
            'Authorization' => 'Bearer ' . $token->plainTextToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        echo "HTTP Code: " . $httpCode . "\n";
        echo "Response: " . $response . "\n";
        if ($error) {
            echo "Error: " . $error . "\n";
        }
        
    } else {
        echo "Token not found in database\n";
    }
    
    // Clean up the token
    $token->accessToken->delete();
    echo "Token cleaned up\n";
    
} else {
    echo "User not found\n";
}




