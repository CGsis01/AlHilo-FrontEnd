import { environment } from 'src/environments/environment';
import { User } from '../../core/models/user.model';

export function getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson)
        throw new Error('No user found in local storage');

    return (JSON.parse(userJson) as User).id;
}

export function getStoredStoreId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson)
        throw new Error('No user found in local storage');

    return (JSON.parse(userJson) as User).store?.id || '';
}