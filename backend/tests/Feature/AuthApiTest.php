<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@civictwin.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@civictwin.local',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'roles', 'permissions'], 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'test@civictwin.local',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@civictwin.local',
            'password' => 'wrong',
        ]);

        $response->assertUnprocessable();
    }

    public function test_login_fails_for_inactive_user(): void
    {
        User::factory()->create([
            'email' => 'inactive@civictwin.local',
            'password' => bcrypt('password'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@civictwin.local',
            'password' => 'password',
        ]);

        $response->assertUnprocessable();
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'me@civictwin.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        // Login to get real token
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'me@civictwin.local',
            'password' => 'password',
        ]);
        $token = $loginRes->json('token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_user_can_register(): void
    {
        // Ensure 'citizen' role exists for auto-assignment
        \Spatie\Permission\Models\Role::create(['name' => 'citizen']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nguyen Van A',
            'email' => 'vana@civictwin.local',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['user', 'token']);

        $this->assertDatabaseHas('users', ['email' => 'vana@civictwin.local']);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@civictwin.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        // Login to get real token
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'logout@civictwin.local',
            'password' => 'password',
        ]);
        $token = $loginRes->json('token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $response->assertOk();
    }
}
