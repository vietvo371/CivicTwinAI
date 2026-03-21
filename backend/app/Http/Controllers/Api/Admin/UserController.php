<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%"));
        }

        if ($request->has('role')) {
            $query->role($request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->latest()->paginate($request->get('per_page', 15));

        $users->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'is_active' => $user->is_active,
                'provider' => $user->provider,
                'roles' => $user->getRoleNames(),
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ];
        });

        return ApiResponse::paginate($users, 'Users retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $user->assignRole($validated['role']);

        return ApiResponse::created([
            ...$user->toArray(),
            'roles' => $user->getRoleNames(),
        ], 'User created successfully');
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:6',
            'phone' => 'sometimes|nullable|string|max:20',
            'role' => 'sometimes|string|exists:roles,name',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $role = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return ApiResponse::success([
            ...$user->fresh()->toArray(),
            'roles' => $user->getRoleNames(),
        ], 'User updated successfully');
    }

    public function destroy(User $user): JsonResponse
    {
        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return ApiResponse::success(null, 'User deactivated successfully');
    }
}
