<?php

declare(strict_types=1);


namespace Tests\Acceptance;

use Tests\Support\AcceptanceTester;

final class PluginMessageShownCest
{
    public function _before(AcceptanceTester $I): void
    {
        // Code here will be executed before each test.
    }

    public function testIfPluginMessageIsShown(AcceptanceTester $I): void
    {
        $I->amOnPage('/');
        $I->see('A Message from My Plugin');
        $I->see('My Plugin is active!');
    }
}
