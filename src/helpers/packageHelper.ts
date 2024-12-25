export const selectEarliestPackage = (purchasedPackages, classType) => {
    const today = new Date();
    const filteredPackages = purchasedPackages.filter((p) => p.expireDate > today.toISOString() && p.availableClasses > 0);
    let earliestPackage = filteredPackages[0];
    filteredPackages.forEach((p) => {
        if (p.expireDate < earliestPackage.expireDate && p.type === classType) {
            earliestPackage = p;
        }
    });
    return earliestPackage;
}