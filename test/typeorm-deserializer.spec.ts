import { deserializeEntities } from '../src/typeorm-deserializer';
import { Person, Town, Country, Food } from './entities';
import { getDataSourcePostgres, getDataSourceSqlite, createSampleData } from './utils';
import 'dotenv/config';

describe('test', () => {

  it('deserialize using query builder (Postgres)', async () => {
    const dataSource = getDataSourcePostgres();
    await dataSource.initialize();
    try {
      await createSampleData(dataSource);
      const mgr = dataSource.manager;
      const query = mgr.createQueryBuilder(Person, 'person')
        .select()
        .innerJoinAndSelect('person.livesInTown', 'town')
        .innerJoinAndSelect('town.country', 'country')
        .innerJoinAndSelect('person.favoriteFood', 'food');
      const rows = await query.getRawMany();
      const entities = deserializeEntities(dataSource, Person, rows, {
        alias: 'person',
        relations: {
          livesInTown: {
            alias: 'town',
            relations: {
              country: 'country'
            }
          },
          favoriteFood: 'food'
        }
      });
      expect(entities.length).toBe(7);
      for (const entity of entities) {
        expect(entity).toBeInstanceOf(Person);
        expect(entity.livesInTown).toBeInstanceOf(Town);
        expect(entity.livesInTown.country).toBeInstanceOf(Country);
        expect(entity.favoriteFood.length).toBeGreaterThan(1);
        for (const food of entity.favoriteFood) {
          expect(food).toBeInstanceOf(Food);
        }
      }
    }
    finally {
      dataSource.close();
    }
  });

  it('deserialize using raw query (Postgres)', async () => {
    const dataSource = getDataSourcePostgres();
    await dataSource.initialize();
    try {
      await createSampleData(dataSource);
      const mgr = dataSource.manager;
      await mgr.query(`SELECT setseed(0.5)`);
      const queryString = `
        SELECT person.id AS person_id, person.name AS person_name, 
               town.id AS town_id, town.name AS town_name, 
               country.id AS country_id, country.name AS country_name, 
               food.id AS food_id, food.name as food_name 
        FROM person
        JOIN town ON town.id = person.lives_in_town_id
        JOIN country ON country.id = town.country_id
        JOIN LATERAL (
        	SELECT * FROM food
        	JOIN person_favorite_food_food ON person_favorite_food_food.food_id = food.id AND person_favorite_food_food.person_id = person.id
        	ORDER BY random()
        	LIMIT 1
        ) food ON true
        WHERE town.population > 5;
      `;
      const rows = await mgr.query(queryString);
      const entities = deserializeEntities(dataSource, Person, rows, {
        alias: 'person',
        relations: {
          livesInTown: {
            alias: 'town',
            relations: {
              country: 'country'
            }
          },
          favoriteFood: 'food'
        }
      });
      expect(entities.length).toBe(5);
      for (const entity of entities) {
        expect(entity).toBeInstanceOf(Person);
        expect(entity.livesInTown).toBeInstanceOf(Town);
        expect(entity.livesInTown.country).toBeInstanceOf(Country);
        expect(entity.livesInTown.name).not.toBe('Berlin');
        expect(entity.favoriteFood.length).toBe(1);
        for (const food of entity.favoriteFood) {
          expect(food).toBeInstanceOf(Food);
        }
      }
    }
    finally {
      dataSource.close();
    }
  });

  it('deserialize using query builder (SQLite)', async () => {
    const dataSource = getDataSourceSqlite();
    await dataSource.initialize();
    try {
      await createSampleData(dataSource);
      const mgr = dataSource.manager;
      const query = mgr.createQueryBuilder(Person, 'person')
        .select()
        .innerJoinAndSelect('person.livesInTown', 'town')
        .innerJoinAndSelect('town.country', 'country')
        .innerJoinAndSelect('person.favoriteFood', 'food');
      const rows = await query.getRawMany();
      const entities = deserializeEntities(dataSource, Person, rows, {
        alias: 'person',
        relations: {
          livesInTown: {
            alias: 'town',
            relations: {
              country: 'country'
            }
          },
          favoriteFood: 'food'
        }
      });
      expect(entities.length).toBe(7);
      for (const entity of entities) {
        expect(entity).toBeInstanceOf(Person);
        expect(entity.livesInTown).toBeInstanceOf(Town);
        expect(entity.livesInTown.country).toBeInstanceOf(Country);
        expect(entity.favoriteFood.length).toBeGreaterThan(1);
        for (const food of entity.favoriteFood) {
          expect(food).toBeInstanceOf(Food);
        }
      }
    }
    finally {
      dataSource.close();
    }
  });

  it('deserialize using raw query (SQLite)', async () => {
    const dataSource = getDataSourceSqlite();
    await dataSource.initialize();
    try {
      await createSampleData(dataSource);
      const mgr = dataSource.manager;
      const queryString = `
        SELECT person.id AS person_id, person.name AS person_name,
               town.id AS town_id, town.name AS town_name, 
               country.id AS country_id, country.name AS country_name, 
               (
                 SELECT id FROM food
                 JOIN person_favorite_food_food ON person_favorite_food_food.food_id = food.id AND person_favorite_food_food.person_id = person.id
                 ORDER BY random()
                 LIMIT 1
               )  AS food_id2,
               food.id as food_id,
               food.name as food_name
        FROM person
        JOIN town ON town.id = person.lives_in_town_id
        JOIN country ON country.id = town.country_id
        JOIN food ON food.id = food_id2
        WHERE town.population > 5;
      `;
      const rows = await mgr.query(queryString);
      const entities = deserializeEntities(dataSource, Person, rows, {
        alias: 'person',
        relations: {
          livesInTown: {
            alias: 'town',
            relations: {
              country: 'country'
            }
          },
          favoriteFood: 'food'
        }
      });
      expect(entities.length).toBe(5);
      for (const entity of entities) {
        expect(entity).toBeInstanceOf(Person);
        expect(entity.livesInTown).toBeInstanceOf(Town);
        expect(entity.livesInTown.country).toBeInstanceOf(Country);
        expect(entity.livesInTown.name).not.toBe('Berlin');
        expect(entity.favoriteFood.length).toBe(1);
        for (const food of entity.favoriteFood) {
          expect(food).toBeInstanceOf(Food);
        }
      }
    }
    finally {
      dataSource.close();
    }
  });

});
