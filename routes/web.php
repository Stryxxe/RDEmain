<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Serve React app for all routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
