export const selectEarliestPackage = (purchasedPackages) => {
    const today = new Date();
    let earliestPackage = purchasedPackages[0];
    purchasedPackages.forEach((p) => {
        if (p.expireDate < earliestPackage.expireDate 
                && p.expireDate > today.toISOString()
                && p.availableClasses > 0) {
            earliestPackage = p;
        }
    });
    return earliestPackage;
}