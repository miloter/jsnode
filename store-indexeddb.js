'use strict';

/**
 * @summary Almacen de elementos clave valor basado el el API IndexedDB
 * que es una base de datos No SQL, de tipo clave => valor.
 * @copyright miloter
 * @license MIT
 * @since 2023-05-11
 * @version 1.1.0 2025-06-27
 */
class StoreIndexedDB {
    static #version = 101;
    #storeName;
    #db;    

    /**
     * Crea una nueva instancia de la clase con un nombre de almacen opcional.
     * @param {string} storeName Nombre del almacen.
     */
    constructor(storeName = 'test_store') {
        this.#storeName = storeName;
        this.#db = null;        
    }

    /**
     * Abre la conexión con la base de datos. Solo se debe abrir una vez y
     * siempre antes de realizar cualquier accíón 'put', 'get', 'delete' o 'clear'.
     * @returns {Promise<IDBDatabase>} Una promesa que se resolverá a un
     * objeto IDBDatabase si se pudo abrir la base de datos.
     */
    async open() {
        return new Promise((resolve, reject) => {
            const requestOpen = window.indexedDB.open(this.#storeName, StoreIndexedDB.#version);
            const self = this;

            requestOpen.onerror = function (event) {
                reject(event.target.error);
            };

            requestOpen.onupgradeneeded = function (event) {
                const db = event.target.result;
                db.createObjectStore(self.#storeName);
            };

            requestOpen.onsuccess = function (event) {
                self.#db = event.target.result;
                resolve(self.#db);
            };
        });
    }

    /**
     * Almacena un nuevo objeto en la base de datos o lo actualiza
     * si la clave ya existe.
     * @param {string|number} key 
     * @param {any} value 
     * @returns {Promise<string|number>} Una promesa que resolverá al valor
     * de la clave si la adición o modificación tuvo éxito.
     */
    async put(key, value) {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.put(value, key);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Obtiene un elemento de la base de datos a partir de su clave.
     * Si el elemnto no existe se devuelve undefined.
     * @param {string|number} key Clave de acceso.
     * @returns {Promise<any>} Una promesa que resolverá al objeto almacenado.
     */
    async get(key) {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.get(key);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }
    /**
     * Obtiene el nombre de una clave de la base de datos a partir de su clave.
     * Si la clave no existe se devuelve undefined.
     * @param {string|number} key Clave de acceso.
     * @returns {Promise<string|number|undefined>} Una promesa que resolverá a la clave o undefined.
     */
    async getKey(key) {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.getKey(key);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Devuelve una promesa que una vez resuelta es un array de claves.
     * @returns {Promise<string[]|number[]>}
     */
    async getAllKeys() {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.getAllKeys();
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Devuelve una promesa que una vez resuelta es un array de todos los valores del almacen.
     * @returns {Promise<any[]>}
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.getAll();
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }    

    /**
     * Devuelve una promesa que una vez resuelta contiene el número
     * de elementos del almacen.
     * @returns {Promise<number>}
     */
    async count() {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.count();            
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Elimina un elemento de la base de datos a partir de su clave.     
     * @param {string|number} key Clave de acceso.
     * @returns {Promise<undefined>}
     */
    async delete(key) {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.delete(key);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Borra todos los elementos almacenados en la base de datos.
     * @returns 
     */
    async clear() {
        return new Promise((resolve, reject) => {
            const store = this.getStore();
            const req = store.clear();
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    /**
     * Devuelve el nombre del almacen de la base de datos.
     */
    get name() {
        return this.#db.name;
    }
    
    /**
     * Devuelve una referencia a este almacen.
     * @returns {IDBObjectStore}
     */
    getStore() {
        const transaction = this.#db.transaction(this.#storeName, 'readwrite');
        return transaction.objectStore(this.#storeName);
    }
}
