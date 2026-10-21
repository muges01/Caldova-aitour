import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('filters roles by department and location independently', async ({ page }) => {
        await page.goto('/');
        const visibleRoleCards = page.locator('[data-testid="role-card"]:visible');

        await page.getByLabel('Department').selectOption({ label: 'Finance' });
        await expect(visibleRoleCards).toHaveCount(2);
        await expect(
            page.locator(
                '[data-testid="role-card"][data-department="Finance"]:visible',
            ),
        ).toHaveCount(2);

        await page.getByTestId('role-filter-reset').click();
        await expect(visibleRoleCards).toHaveCount(expectedRoleCount);

        await page.getByLabel('Location').selectOption({
            label: 'Helsinki, Finland',
        });
        await expect(visibleRoleCards).toHaveCount(1);
        await expect(visibleRoleCards.first()).toHaveAttribute(
            'data-location',
            'Helsinki, Finland',
        );
    });

    test('combines filters with AND and reset restores all roles', async ({ page }) => {
        await page.goto('/');
        const visibleRoleCards = page.locator('[data-testid="role-card"]:visible');

        await page.getByLabel('Department').selectOption({ label: 'Finance' });
        await page.getByLabel('Location').selectOption({
            label: 'Woodinville, WA, USA',
        });
        await expect(visibleRoleCards).toHaveCount(1);
        await expect(visibleRoleCards.first()).toHaveAttribute(
            'data-department',
            'Finance',
        );
        await expect(visibleRoleCards.first()).toHaveAttribute(
            'data-location',
            'Woodinville, WA, USA',
        );

        await page.getByTestId('role-filter-reset').click();
        await expect(visibleRoleCards).toHaveCount(expectedRoleCount);
        await expect(page.getByLabel('Department')).toHaveValue('');
        await expect(page.getByLabel('Location')).toHaveValue('');
    });

    test('shows an empty state when no roles match and clears it on reset', async ({
        page,
    }) => {
        await page.goto('/');
        const visibleRoleCards = page.locator('[data-testid="role-card"]:visible');
        const filterEmptyState = page.getByTestId('filter-empty-state');

        await page.getByLabel('Department').selectOption({ label: 'Technology' });
        await page.getByLabel('Location').selectOption({
            label: 'Woodinville, WA, USA',
        });
        await expect(visibleRoleCards).toHaveCount(0);
        await expect(filterEmptyState).toBeVisible();
        await expect(filterEmptyState).toContainText(
            'No roles match those filters.',
        );

        await page.getByTestId('role-filter-reset').click();
        await expect(visibleRoleCards).toHaveCount(expectedRoleCount);
        await expect(filterEmptyState).toBeHidden();
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on the card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
