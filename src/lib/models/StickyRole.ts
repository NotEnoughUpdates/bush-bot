import { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

export interface StickyRoleModel {
	user: Snowflake;
	guild: Snowflake;
	roles: Snowflake[];
}
export interface StickyRoleModelCreationAttributes {
	user: Snowflake;
	guild: Snowflake;
	roles: Snowflake[];
}

export class StickyRole extends BaseModel<StickyRoleModel, StickyRoleModelCreationAttributes> implements StickyRoleModel {
	user: Snowflake;
	guild: Snowflake;
	roles: Snowflake[];
	static initModel(sequelize: Sequelize): void {
		StickyRole.init(
			{
				user: {
					type: DataTypes.STRING,
					allowNull: false
				},
				guild: {
					type: DataTypes.STRING,
					allowNull: false
				},

				roles: {
					type: DataTypes.STRING,
					get: function () {
						return JSON.parse(this.getDataValue('roles') as unknown as string);
					},
					set: function (val: Snowflake[]) {
						return this.setDataValue('roles', JSON.stringify(val) as unknown as Snowflake[]);
					},
					allowNull: true
				}
			},
			{ sequelize }
		);
	}
}