const configure = jest.fn();
const setLogLevel = jest.fn();
const logIn = jest.fn().mockResolvedValue({ customerInfo: {} });
const logOut = jest.fn().mockResolvedValue(undefined);
const purchasePackage = jest.fn().mockResolvedValue({
  customerInfo: { entitlements: { active: {} } },
  productIdentifier: 'core_monthly',
});
const getOfferings = jest.fn().mockResolvedValue({
  current: {
    identifier: 'core',
    availablePackages: [
      { identifier: 'core_monthly' },
      { identifier: 'core_annual' },
    ],
  },
  all: {},
});

const Purchases = {
  configure,
  setLogLevel,
  purchasePackage,
  getOfferings,
  logIn,
  logOut,
};

export const __esModule = true;
export const LOG_LEVEL = { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

export default Purchases;
