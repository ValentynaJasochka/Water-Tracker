import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Field, Formik } from 'formik';
import * as yup from 'yup';

import Notiflix from 'notiflix';

import defaultAvatar from '../../../images/SettingModal/default_user_avatar.svg';

import {
  Container,
  ErrEmailMessage,
  ErrMessage,
  FieldForm,
  FormUser,
  Gender,
  GenderWrapper,
  NameWrapper,
  Password,
  RadioWrapper,
  SaveBtn,
  TopicGender,
  Wrapper,
} from './SettingsFormModal.styled';

import {
  MainWrapper,
  UploadInput,
  UploadWrapper,
  Label,
  IconUploadImage,
  IconUser,
  UploaLoader,
  UploadLoaderWrapper,
  EyeIcon,
  HideIcon,
  Title,
  ToggleIcon,
} from '../SettingModal.styled';

import {
  selectAvatar,
  selectIsError,
  selectUser,
} from '../../../redux/auth/selectors';
import { updateAvatar, updateUserData } from '../../../redux/auth/operations';

const isValueRequired = (value, referenceValue) => {
  return (
    !(referenceValue && referenceValue.trim().length > 0) ||
    (value && value.trim().length > 0)
  );
};

function outdatedPasswordIsRequired(value) {
  const password = this.parent.password;
  return isValueRequired(value, password);
}

function newPasswordIsRequired(value) {
  const passwordOutdated = this.parent.passwordOutdated;
  return isValueRequired(value, passwordOutdated);
}

function passwordRepeatIsRequired(value) {
  const password = this.parent.password;
  return isValueRequired(value, password);
}

const updateUserInfoSchema = yup.object().shape({
  name: yup
    .string()
    .matches(/^[a-zA-Zа-яА-Я\s'-]*$/, 'Name should not contain numbers'),

  email: yup
    .string()
    .email('Invalid email format')
    .matches(/^[-?\w.?%?]+@\w+.{1}\w{2,4}$/),

  passwordOutdated: yup.string().test({
    name: 'passwordOutdated',
    test: outdatedPasswordIsRequired,
    message: 'Outdated password is required',
  }),

  password: yup
    .string()
    .test({
      name: 'password',
      test: newPasswordIsRequired,
      message: 'New password is required',
    })
    .min(8, 'Too short')
    .max(48, 'Too long')
    .matches(/[a-zA-Z]/, 'Must contain at least one letter'),

  passwordRepeat: yup
    .string()
    .test({
      name: 'passwordRepeat',
      test: passwordRepeatIsRequired,
      message: 'Repeat password is required',
    })
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
});

export const FormModal = ({ close }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [sendForm, setSendForm] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);

  const input = useRef();
  const dispatch = useDispatch();
  const currentAvatar = useSelector(selectAvatar);

  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const user = useSelector(selectUser);
  const error = useSelector(selectIsError);

  const toggle = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (values, { resetForm }) => {
    const { passwordRepeat, ...restFields } = values;

    const filledFields = Object.fromEntries(
      Object.entries(restFields).filter(
        ([key, value]) => value !== '' && value !== undefined
      )
    );

    const hasChanges = Object.entries(filledFields).some(
      ([key, value]) => value !== user[key]
    );

    if (!hasChanges && !avatarChanged) {
      Notiflix.Notify.warning(
        'No changes made. Profile data remains the same.'
      );
      return;
    }

    if (!hasChanges && avatarChanged) {
      Notiflix.Notify.success('Your profile data was successfully updated');
      close();
      return;
    }

    await dispatch(updateUserData(filledFields));

    setSendForm(true);
    resetForm();
  };

  const handleFileChange = async e => {
    try {
      setLoadingAvatar(true);
      await dispatch(updateAvatar(e.target.files[0]));
      setAvatarChanged(true);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoadingAvatar(false);
    }
  };

  useEffect(() => {
    if (sendForm && error) {
      Notiflix.Notify.failure(`${error}`);
    } else if (sendForm && !error) {
      Notiflix.Notify.success('Your profile data was successfully updated');
      close();
    }

    setSendForm(false);
  }, [error, sendForm, close]);

  return (
    <>
      <Title>Your photo</Title>
      <MainWrapper>
        {loadingAvatar ? (
          <UploadLoaderWrapper>
            <UploaLoader />
          </UploadLoaderWrapper>
        ) : (
          <IconUser src={currentAvatar || defaultAvatar} alt="user_photo" />
        )}

        <UploadWrapper>
          <Label>
            <IconUploadImage />
            <UploadInput
              ref={input}
              type="file"
              id="file-input"
              onChange={handleFileChange}
              accept="image/*, .png, .jpeg, .gif, .web"
            />
            Upload a photo
          </Label>
        </UploadWrapper>
      </MainWrapper>

      <Formik
        initialValues={{
          gender: '' || user.gender,
          name: '',
          email: '',
          passwordOutdated: '',
          password: '',
          passwordRepeat: '',
        }}
        validationSchema={updateUserInfoSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched }) => (
          <FormUser>
            <Wrapper>
              <TopicGender>Your gender identity</TopicGender>
              <RadioWrapper>
                <GenderWrapper>
                  <Field
                    type="radio"
                    id="girl"
                    name="gender"
                    value="girl"
                    checked={values.gender === 'girl'}
                  />

                  <Gender htmlFor="girl">Girl</Gender>
                </GenderWrapper>
                <Field
                  id="man"
                  type="radio"
                  name="gender"
                  value="man"
                  checked={values.gender === 'man'}
                />
                <Gender htmlFor="man">Man</Gender>
              </RadioWrapper>

              <Title>Your name</Title>

              <NameWrapper>
                <FieldForm
                  type="text"
                  name="name"
                  placeholder={user.name || 'Enter your name'}
                />{' '}
              </NameWrapper>

              <Title>Your email</Title>
              <FieldForm
                id="email"
                name="email"
                placeholder={user.email || 'Email'}
                title="email"
                autoComplete="on"
                hasErrors={touched.email && errors.email}
              />

              {touched.email && errors.email && (
                <ErrEmailMessage name="email" component="p">
                  {errors.email}
                </ErrEmailMessage>
              )}

              <ErrEmailMessage name="email" component="p" />
            </Wrapper>

            <Wrapper>
              <TopicGender>Password</TopicGender>
              <Password htmlFor="passwordOutdated">Outdated password:</Password>
              <Container>
                <FieldForm
                  id="passwordOutdated"
                  name="passwordOutdated"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={'Password'}
                  title="passwordOutdated"
                  autoComplete="on"
                  hasErrors={
                    touched.passwordOutdated && errors.passwordOutdated
                  }
                />

                {touched.passwordOutdated && errors.passwordOutdated && (
                  <ErrMessage name="passwordOutdated" component="p">
                    {errors.passwordOutdated}
                  </ErrMessage>
                )}

                <ToggleIcon onClick={toggle}>
                  {showPassword ? <EyeIcon /> : <HideIcon />}
                </ToggleIcon>
              </Container>
              <ErrMessage name="passwordOutdated" component="p" />

              <Password htmlFor="password">New password:</Password>

              <Container>
                <FieldForm
                  name="password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  title="Password"
                  placeholder="Password"
                  autoComplete="on"
                  hasErrors={touched.password && errors.password}
                />

                {touched.password && errors.password && (
                  <ErrMessage name="password" component="p">
                    {errors.password}
                  </ErrMessage>
                )}

                <ToggleIcon onClick={toggle}>
                  {showPassword ? <EyeIcon /> : <HideIcon />}
                </ToggleIcon>
              </Container>
              <ErrMessage name="password" component="p" />

              <Password htmlFor="passwordRepeat">Repeat new password:</Password>

              <Container>
                <FieldForm
                  name="passwordRepeat"
                  id="passwordRepeat"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="on"
                  hasErrors={touched.passwordRepeat && errors.passwordRepeat}
                />

                {touched.passwordRepeat && errors.passwordRepeat && (
                  <ErrMessage name="passwordRepeat" component="p">
                    {errors.passwordRepeat}
                  </ErrMessage>
                )}

                <ToggleIcon onClick={toggle}>
                  {showPassword ? <EyeIcon /> : <HideIcon />}
                </ToggleIcon>
              </Container>
              <ErrMessage name="passwordRepeat" component="p" />
            </Wrapper>
            <SaveBtn type="submit">Save</SaveBtn>
          </FormUser>
        )}
      </Formik>
    </>
  );
};
