import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm'
import { Person } from './person';
import { Country } from './country';

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
