<?php

declare(strict_types=1);


namespace Tests\Acceptance;

use Tests\Support\AcceptanceTester;

final class ThemeMessageShownCest
{
    public function _before(AcceptanceTester $I): void
    {
        // Code here will be executed before each test.
    }

    public function testIfThemeMessageIsShown(AcceptanceTester $I): void
    {
        $I->amOnPage('/');
        $I->see('Hello. This is my theme!');
        $I->makeScreenshot('theme-message-shown');
    }
}
