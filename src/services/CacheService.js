const DEFAULT_EXP_TIME = 10 * 60 * 1000; // 10 minutes

class CacheService {
  #cacheByName = {};
  #expTimeByName = {};
  #cacheExpTime = 0;

  constructor(cacheExpTime = DEFAULT_EXP_TIME) {
    this.#cacheExpTime = cacheExpTime;
  }

  setValue(name, value) {
    if (!name) throw new Error("Name must be specified");
    this.#cacheByName[name] = value;
    this.#expTimeByName[name] = Date.now() + this.#cacheExpTime;
  }

  getValue(name) {
    return this.#cacheByName[name];
  }

  exists(name) {
    if (!this.#expTimeByName[name]) return false;
    if (this.#expTimeByName <= Date.now()) {
      console.log(`cache exp ${name}`);

      delete this.#cacheByName[name];
      delete this.#expTimeByName[name];

      return false;
    }
    return this.#cacheByName[name] !== undefined;
  }

  delValue(name) {
    delete this.#cacheByName[name];
  }

  getAllValues() {
    return this.#cacheByName;
  }
}

export default CacheService;
