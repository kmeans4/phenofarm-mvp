# Playwright Tests for PhenoFarm MVP

## Setup

Playwright is already installed. If you need to reinstall browsers:
```bash
npx playwright install chromium
```

## Running Tests

### Run all auth screenshot tests:
```bash
npx playwright test
```

### Run in headed mode (visible browser):
```bash
npx playwright test --headed
```

### Run specific test file:
```bash
npx playwright test auth-screenshots.spec.ts
```

### Screenshot a specific page:
```bash
TEST_PAGE=/admin/products npx playwright test --grep "Screenshot specific admin page"
```

### Debug mode (step through tests):
```bash
npx playwright test --debug
```

### View test report:
```bash
npx playwright show-report
```

## Screenshots Location

All screenshots are saved to `screenshots/` folder:
- `admin-dashboard.png`
- `admin-users.png`
- `admin-growers.png`
- `admin-dispensaries.png`
- `admin-settings.png`
- `grower-dashboard.png`
- `grower-products.png`
- `grower-orders.png`
- `dispensary-dashboard.png`
- `dispensary-products.png`
- `dispensary-orders.png`
- `dispensary-order-detail.png`

## Test Credentials

- **Admin:** admin@phenofarm.com
- **Grower:** grower@vtnurseries.com
- **Dispensary:** dispensary@greenvermont.com
- **Password:** password123

## Extending Tests

To add new page screenshots, edit `auth-screenshots.spec.ts` and add to the `PAGES_BY_ROLE` object.

To test dynamic pages (order detail, product edit), the tests automatically try to find and click links to those pages from list views.
