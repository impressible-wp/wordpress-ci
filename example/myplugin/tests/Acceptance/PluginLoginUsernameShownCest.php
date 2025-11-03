<?php

declare(strict_types=1);


namespace Tests\Acceptance;

use Tests\Support\AcceptanceTester;

final class PluginLoginUsernameShownCest
{
    public function __construct(
        protected $username = 'user',
        protected $password = 'password',
    )
    {
    }

    public function _before(AcceptanceTester $I): void
    {
        $I->amOnPage('/wp-admin');

        // See and fill in WordPress login form
        $I->seeElement('form#loginform');
        $I->fillField('input#user_login', $this->username);
        $I->fillField('input#user_pass', $this->password);
        $I->click('input#wp-submit');

        // Check if there is error message
        $I->dontSee('Error: ');

        // Check if the user is at dashboard page
        $I->see('Dashboard');
    }

    public function testIfUsernameIsShown(AcceptanceTester $I): void
    {
        $I->amOnPage('/');
        $I->see("Welcome, {$this->username}!");
        $I->makeScreenshot('plugin-login-username-is-shown');
    }
}
