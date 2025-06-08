# Description

Allows to deserialize [TypeORM](https://typeorm.io) entities from raw queries.

## Installation

```bash
npm i typeorm-deserializer
```

## Usage

### Query
```sql
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
```

### Code
```typescript
import { deserializeEntities } from 'typeorm-deserializer';

...
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
```

### Entities
```typescript
@Entity()
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @ManyToOne(() => Town, town => town.people)
  livesInTown: Town;
  @JoinTable()
  @ManyToMany(() => Food, food => food.people)
  favoriteFood: Food[];
}
@Entity()
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
}
@Entity()
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @ManyToMany(() => Person, person => person.favoriteFood)
  people: Person[];
}
@Entity()
export class Town {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  population: number;
  @ManyToOne(() => Country)
  country: Country;
  @OneToMany(() => Person, person => person.livesInTown)
  people: Person[];
}
```

### Result
```typescript
[
  Person {
    id: '70108e53-da6d-40f4-a132-9f129df3693b',
    name: 'John',
    livesInTown: Town {
      id: '1a8ffe23-fa1d-4229-8d63-7de292c5505f',
      name: 'London',
      country: Country {
        id: 'c0c78bde-47fb-45db-bbf6-d63f0ce39fbc',
        name: 'UK'
      }
    },
    favoriteFood: [
      Food {
        id: '8a5a3c40-b69e-4fc8-a168-39ab10d63761',
        name: 'salad'
      }
    ]
  },
  Person {
    id: 'e9c50888-0fd8-40dd-88a9-1d3b4d2fd138',
    name: 'Kristin',
    livesInTown: Town {
      id: '1a8ffe23-fa1d-4229-8d63-7de292c5505f',
      name: 'London',
      country: Country {
        id: 'c0c78bde-47fb-45db-bbf6-d63f0ce39fbc',
        name: 'UK'
      }
    },
    favoriteFood: [
      Food { id: 'bceba7c3-fc14-4d51-8954-bf61bae4f048', name: 'tuna' }
    ]
  },
  Person {
    id: '2dc28b66-ec1f-4e89-bf9c-7ab3f68a4c0e',
    name: 'Diego',
    livesInTown: Town {
      id: '1a8ffe23-fa1d-4229-8d63-7de292c5505f',
      name: 'London',
      country: Country {
        id: 'c0c78bde-47fb-45db-bbf6-d63f0ce39fbc',
        name: 'UK'
      }
    },
    favoriteFood: [
      Food {
        id: '241cb138-b159-4463-af62-f70300e5fee2',
        name: 'pizza'
      }
    ]
  },
  Person {
    id: '1a339cde-a900-4861-af80-2ee3436f9690',
    name: 'Sergej',
    livesInTown: Town {
      id: 'e4b31df5-1346-4ff9-81b2-d90429f3ebba',
      name: 'New York',
      country: Country {
        id: '074f35df-83f1-4ec5-b178-5dc9376c11ab',
        name: 'USA'
      }
    },
    favoriteFood: [
      Food {
        id: '628803c1-dbbe-4be2-b4b3-a16fee4f744c',
        name: 'curry'
      }
    ]
  },
  Person {
    id: '566ae208-26cb-4e4a-a5cb-6a2f715869f3',
    name: 'Clara',
    livesInTown: Town {
      id: '950b7160-a3f1-491f-83c2-395dcc81a62a',
      name: 'Tokyo',
      country: Country {
        id: '7da830ae-3d3c-4204-b015-f92c75ee2374',
        name: 'Japan'
      }
    },
    favoriteFood: [
      Food {
        id: '241cb138-b159-4463-af62-f70300e5fee2',
        name: 'pizza'
      }
    ]
  }
]
```

## Local Testing

### PostgreSQL Setup
Local installation of PostgreSQL is required to run local tests.\
Environment variables used by tests:
```
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USERNAME
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

### SQLite setup
None required as SQLite runs in memory.

### Running Tests
```bash
npm run test
```
