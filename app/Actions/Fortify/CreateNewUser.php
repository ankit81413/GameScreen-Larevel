<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'alpha_dash',
                Rule::unique(User::class, 'username'),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => trim($input['first_name'].' '.$input['last_name']),
            'email' => $input['email'] ?? null,
            'username' => $input['username'],
            'password' => $input['password'],
            'birthdate' => null,
            'age_confirmed' => false,
            'gender' => null,
            'bio' => null,
        ]);
    }
}
