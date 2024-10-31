import React, { useEffect } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { getEntityTitle } from '../../utils/utils';
import { DateRangeFilter } from './DateRangeFilter';
import { PostType } from '@drodil/backstage-plugin-qeta-common';
import { useQetaApi, useStyles, useTranslation } from '../../hooks';

const radioSelect = (value: string, label: string) => {
  return (
    <FormControlLabel
      value={value}
      control={<Radio size="small" />}
      label={label}
    />
  );
};

export const filterKeys = [
  'orderBy',
  'order',
  'noAnswers',
  'noCorrectAnswer',
  'noVotes',
  'entity',
  'tags',
  'dateRange',
] as const;
export type FilterKey = (typeof filterKeys)[number];

export type Filters = {
  order: string;
  orderBy: string;
  noAnswers?: string;
  noCorrectAnswer?: string;
  noVotes?: string;
  searchQuery: string;
  entity?: string;
  tags?: string[];
  dateRange?: string;
  collectionId?: number;
  type?: PostType;
};

export interface FilterPanelProps {
  onChange: (key: FilterKey, value: string | string[]) => void;
  filters: Filters;
  showEntityFilter?: boolean;
  showTagFilter?: boolean;
  answerFilters?: boolean;
  type?: PostType;
  orderByFilters?: {
    showRankOrder?: boolean;
    showViewsOrder?: boolean;
    showTrendsOrder?: boolean;
    showAnswersOrder?: boolean;
    showUpdatedOrder?: boolean;
    showScoreOrder?: boolean;
    showTitleOrder?: boolean;
  };
  quickFilters?: {
    showNoAnswers?: boolean;
    showNoCorrectAnswer?: boolean;
    showNoVotes?: boolean;
  };
}

export const FilterPanel = (props: FilterPanelProps) => {
  const {
    onChange,
    filters,
    showEntityFilter = true,
    showTagFilter = true,
    type,
    orderByFilters = {
      showRankOrder: false,
      showViewsOrder: true,
      showTrendsOrder: true,
      showAnswersOrder: true,
      showUpdatedOrder: true,
      showScoreOrder: true,
      showTitleOrder: true,
    },
    quickFilters = {
      showNoAnswers: true,
      showNoCorrectAnswer: true,
      showNoVotes: true,
    },
  } = props;
  const styles = useStyles();
  const { value: refs } = useQetaApi(api => api.getEntities(), []);
  const { value: tags } = useQetaApi(api => api.getTags(), []);
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();
  const [availableEntities, setAvailableEntities] = React.useState<
    Entity[] | null
  >(null);
  const [selectedEntity, setSelectedEntity] = React.useState<
    Entity | undefined
  >(undefined);
  const [availableTags, setAvailableTags] = React.useState<string[] | null>(
    null,
  );
  const [tagDescriptions, setTagDescriptions] = React.useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if ((tags && tags.tags && tags.total > 0) || filters.tags) {
      const ts = (tags?.tags ?? []).map(tag => tag.tag);
      if (filters.tags) {
        ts.push(...filters.tags);
      }
      setAvailableTags([...new Set(ts)]);
      setTagDescriptions(
        tags?.tags.reduce((acc, tag) => {
          if (!tag.description) {
            return acc;
          }
          acc[tag.tag] = tag.description;
          return acc;
        }, {} as Record<string, string>) ?? {},
      );
    }
  }, [tags, filters.tags]);

  useEffect(() => {
    const entityRefs: string[] = [];
    if (filters.entity && !Array.isArray(filters.entity)) {
      entityRefs.push(filters.entity);
    }
    if (refs && refs.entities && refs.total > 0) {
      refs.entities.forEach(ref => {
        // ignore currently selected entity if exist in refs
        if (ref.entityRef !== filters.entity) {
          entityRefs.push(ref.entityRef);
        }
      });
    }
    if (entityRefs.length > 0) {
      catalogApi
        .getEntitiesByRefs({
          entityRefs,
          fields: [
            'kind',
            'metadata.name',
            'metadata.namespace',
            'metadata.title',
          ],
        })
        .then(resp => {
          const filtered = resp.items.filter(i => i !== undefined) as Entity[];
          setAvailableEntities(filtered);
        });
    }
  }, [filters.entity, catalogApi, refs]);

  useEffect(() => {
    if (filters.entity && availableEntities) {
      const value = availableEntities.find(
        e => stringifyEntityRef(e) === filters.entity,
      );
      setSelectedEntity(value);
      if (!value) {
        onChange('entity', '');
      }
    } else {
      setSelectedEntity(undefined);
    }
  }, [availableEntities, filters.entity, onChange]);

  const handleChange = (event: {
    target: {
      value: string | string[];
      type?: string;
      name: string;
      checked?: boolean;
    };
  }) => {
    let value = event.target.value;
    if (event.target.type === 'checkbox') {
      value = event.target.checked ? 'true' : 'false';
    }
    onChange(event.target.name as FilterKey, value);
  };

  return (
    <Box className={`qetaFilterPanel ${styles.filterPanel}`}>
      <Grid
        container
        spacing={4}
        alignItems="stretch"
        justifyContent="space-evenly"
      >
        {(quickFilters.showNoVotes ||
          quickFilters.showNoAnswers ||
          quickFilters.showNoCorrectAnswer) && (
          <Grid item>
            <FormGroup>
              <FormLabel id="qeta-filter-quick">
                {t('filterPanel.quickFilters.label')}
              </FormLabel>
              {quickFilters.showNoAnswers && type !== 'article' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      name="noAnswers"
                      onChange={handleChange}
                      checked={filters.noAnswers === 'true'}
                    />
                  }
                  label={t('filterPanel.noAnswers.label')}
                />
              )}
              {quickFilters.showNoCorrectAnswer && type !== 'article' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      name="noCorrectAnswer"
                      checked={filters.noCorrectAnswer === 'true'}
                      onChange={handleChange}
                    />
                  }
                  label={t('filterPanel.noCorrectAnswers.label')}
                />
              )}
              {quickFilters.showNoVotes && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      name="noVotes"
                      checked={filters.noVotes === 'true'}
                      onChange={handleChange}
                    />
                  }
                  label={t('filterPanel.noVotes.label')}
                />
              )}
            </FormGroup>
          </Grid>
        )}
        <Grid item>
          <FormControl>
            <FormLabel id="qeta-filter-order-by">
              {t('filterPanel.orderBy.label')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="qeta-filter-order-by"
              name="orderBy"
              value={filters.orderBy}
              onChange={handleChange}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0 1rem',
              }}
            >
              {orderByFilters.showRankOrder &&
                radioSelect('rank', t('filterPanel.orderBy.rank'))}
              {radioSelect('created', t('filterPanel.orderBy.created'))}
              {orderByFilters.showTitleOrder &&
                radioSelect('title', t('filterPanel.orderBy.title'))}
              {orderByFilters.showViewsOrder &&
                radioSelect('views', t('filterPanel.orderBy.views'))}
              {orderByFilters.showScoreOrder &&
                radioSelect('score', t('filterPanel.orderBy.score'))}
              {orderByFilters.showTrendsOrder &&
                radioSelect('trend', t('filterPanel.orderBy.trend'))}
              {orderByFilters.showAnswersOrder &&
                radioSelect('answersCount', t('filterPanel.orderBy.answers'))}
              {orderByFilters.showUpdatedOrder &&
                radioSelect('updated', t('filterPanel.orderBy.updated'))}
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControl>
            <FormLabel id="qeta-filter-order">
              {t('filterPanel.order.label')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="qeta-filter-order"
              name="order"
              value={filters.order}
              onChange={handleChange}
            >
              {radioSelect('desc', t('filterPanel.order.desc'))}
              {radioSelect('asc', t('filterPanel.order.asc'))}
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
      <Box marginY="24px">
        <Divider />
      </Box>
      <Grid container alignItems="stretch" justifyContent="space-evenly">
        <Grid item>
          <DateRangeFilter value={filters.dateRange} onChange={onChange} />
        </Grid>

        {showEntityFilter &&
          availableEntities &&
          availableEntities.length > 0 && (
            <Grid item>
              <Autocomplete
                multiple={false}
                disablePortal
                className="qetaEntityFilter"
                value={selectedEntity ?? null}
                id="entities-select"
                options={availableEntities}
                renderOption={option => {
                  return (
                    <>
                      <Tooltip title={stringifyEntityRef(option)}>
                        <span>{getEntityTitle(option)}</span>
                      </Tooltip>
                    </>
                  );
                }}
                getOptionLabel={getEntityTitle}
                getOptionSelected={(o, v) => {
                  if (!o || !v) {
                    return false;
                  }
                  return stringifyEntityRef(o) === stringifyEntityRef(v);
                }}
                onChange={(_e, newValue) => {
                  handleChange({
                    target: {
                      name: 'entity',
                      value: newValue ? stringifyEntityRef(newValue) : '',
                    },
                  });
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    style={{ minWidth: '200px' }}
                    variant="outlined"
                    margin="normal"
                    label={t('filterPanel.filters.entity.label')}
                    placeholder={t('filterPanel.filters.entity.placeholder')}
                  />
                )}
              />
            </Grid>
          )}
        {showTagFilter && availableTags && availableTags.length > 0 && (
          <Grid item>
            <Autocomplete
              multiple
              style={{ minWidth: '200px' }}
              disablePortal
              className="qetaTagFilter"
              value={filters.tags}
              id="tags-select"
              options={availableTags}
              renderOption={option => {
                if (tagDescriptions[option]) {
                  return (
                    <>
                      <Tooltip title={tagDescriptions[option]}>
                        <span>{option}</span>
                      </Tooltip>
                    </>
                  );
                }
                return option;
              }}
              onChange={(_e, newValue) => {
                handleChange({
                  target: {
                    name: 'tags',
                    value: newValue,
                  },
                });
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  margin="normal"
                  label={t('filterPanel.filters.tag.label')}
                  placeholder={t('filterPanel.filters.tag.placeholder')}
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
