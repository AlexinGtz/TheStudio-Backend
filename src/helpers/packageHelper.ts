export const selectEarliestPackage = (purchasedPackages) => {
    const today = new Date();
    const filteredPackages = purchasedPackages.filter((p) => p.expireDate > today.toISOString() && p.availableClasses > 0);
    let earliestPackage = filteredPackages[0];
    filteredPackages.forEach((p) => {
        if (p.expireDate < earliestPackage.expireDate) {
            earliestPackage = p;
        }
    });
    return earliestPackage;
}