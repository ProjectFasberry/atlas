import { NicknameInput, PasswordInput } from "./auth"
import { reatomComponent } from "@reatom/npm-react"
import { auth, type AuthFindoutType, authState } from "../models/auth.model"
import { Input } from "@/shared/ui/input"
import { type JSX, type ReactNode, useState } from "react"
import { Button } from "@/shared/ui/button"
import { SeedPhrase, SeedPhraseFooter, SeedPhraseHeader, SeedPhraseBody } from "@/shared/ui/seed-phrase"
import { Icon } from "@/shared/ui/icon"
import {
  type AuthRegisterType,
  registerNavigationModel, register, registerSeedPhraseModel, registerState, findoutSelectedTypeAtom,
  createFindoutOptions
} from "../models/register.model"
import { IconLoader } from "@/shared/ui/icon-loader"
import { spawn } from "@reatom/framework"
import { translate } from "@/shared/locales/helpers"
import { Select, createListCollection } from '@ark-ui/react/select'
import { Portal } from "@ark-ui/react/portal"
import { selectVariant, selectContentBaseStyle } from "@/shared/ui/select"
import { Typography } from "@/shared/ui/typography"
import { getLocale } from "@/paraglide/runtime"
import { Checkbox } from "@ark-ui/react/checkbox"
import { checkboxVariant } from "@/shared/ui/checkbox"

const FindoutReferrerInput = reatomComponent(({ ctx }) => (
  <Input
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    autoComplete="new-referrer"
    placeholder={translate["auth.shared.placeholders.nickname"]()}
    variant={ctx.spy(authState.errorsType).includes("findout") ? "danger" : "default"}
    className="w-full"
    value={ctx.spy(authState.fields.findout) ?? ""}
    onClick={() => auth.resetError(ctx)}
    onChange={e => authState.fields.findout(ctx, e.target.value)}
    maxLength={32}
  />
), "FindoutReferrerInput")
const FindoutOtherInput = reatomComponent(({ ctx }) => (
  <Input
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    autoComplete="new-other"
    placeholder={translate["auth.register.placeholders.findoutOther"]()}
    className="w-full"
    variant={ctx.spy(authState.errorsType).includes("findout") ? "danger" : "default"}
    value={ctx.spy(authState.fields.findout) ?? ""}
    onClick={() => auth.resetError(ctx)}
    onChange={e => authState.fields.findout(ctx, e.target.value)}
    maxLength={128}
  />
), "FindoutOtherInput")

const FINDOUT_COMPONENTS: Record<AuthFindoutType, ReactNode> = {
  "referrer": <FindoutReferrerInput />,
  "custom": <FindoutOtherInput />
}

const FINDOUT_COLLECTION = createListCollection({
  items: createFindoutOptions()
})

const FindoutOptions = reatomComponent(({ ctx }) => {
  const currentItem = ctx.spy(findoutSelectedTypeAtom)

  return (
    <Select.Root
      collection={FINDOUT_COLLECTION}
      value={currentItem ? [currentItem.value] : []}
      onValueChange={({ value }) => authState.fields.findoutType(ctx, value[0] as AuthFindoutType)}
      className="flex flex-col gap-1 w-full"
    >
      <Select.Control className={selectVariant.control()}>
        <Select.Trigger className={selectVariant.trigger()}>
          <Select.ValueText>
            {currentItem?.title ?? translate["auth.register.placeholders.findout"]()}
          </Select.ValueText>
        </Select.Trigger>
        <div className={selectVariant.indicators()}>
          <Select.ClearTrigger className={selectVariant.clearTrigger()}>
            <Icon name="sprite:x" className="size-5" />
          </Select.ClearTrigger>
          <Select.Indicator className={selectVariant.indicator()}>
            <Icon name="sprite:selector" className="size-5" />
          </Select.Indicator>
        </div>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content className={selectVariant.content()} style={selectContentBaseStyle}>
            <Select.ItemGroup className={selectVariant.itemGroup()}>
              {createFindoutOptions().map((item) => (
                <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                  <Select.ItemText className={selectVariant.itemText()}>
                    {item.title}
                  </Select.ItemText>
                  <Select.ItemIndicator className={selectVariant.itemIndicator()}>
                    <Icon name="sprite:check" className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect />
    </Select.Root>
  )
}, "FindoutOptions")

const FindoutComponent = reatomComponent(({ ctx }) => {
  const data = ctx.spy(authState.fields.findoutType)
  if (!data) return null;
  return FINDOUT_COMPONENTS?.[data] ?? null;
}, "FindoutComponent")

const PrivacyTerms = reatomComponent(({ ctx }) => {
  return (
    <div className="inline-flex gap-2 items-start">
      <Checkbox.Root
        id="rules"
        checked={ctx.spy(authState.fields.acceptRules)}
        onCheckedChange={(e) => typeof e.checked === 'boolean' && authState.fields.acceptRules(ctx, e.checked)}
        className={checkboxVariant.root()}
      >
        <Checkbox.Control className={checkboxVariant.control({ variant: "filled" })} />
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <label
        lang={getLocale()}
        className="select-none relative -top-1 text-sm [&_a]:text-green-500 [&_a]:inline [hyphens:auto]"
        htmlFor="checkbox:rules:input"
      >
        {translate["auth.register.acceptRulesTitle"]()}
        <a href="/privacy" target="_blank">
          &nbsp;{translate["auth.register.acceptRulesPrivacy"]()}
        </a>,
        <a href="/terms" target="_blank">
          &nbsp;{translate["auth.register.acceptRulesProcessing"]()}&nbsp;
        </a>
        и
        <a href="/rules" target="_blank">
          &nbsp;{translate["auth.register.acceptRulesProject"]()}
        </a>.
      </label>
    </div>
  )
}, "PrivacyTerms")

const RegisterStartInput = () => (
  <>
    <div className="flex flex-col gap-2 w-full">
      <NicknameInput />
      <PasswordInput />
      <div className="flex flex-col gap-2 w-full">
        <FindoutOptions />
        <FindoutComponent />
      </div>
    </div>
    <PrivacyTerms />
  </>
)

const RegisterSeedPhraseConfirm = reatomComponent(({ ctx }) => {
  const words = ctx.spy(registerSeedPhraseModel.state.repeatWords)
  const [isHidden, setIsHidden] = useState(true);

  return (
    <SeedPhrase
      words={words}
      isEditable={true}
      isHidden={isHidden}
      className="gap-6"
      onUpdateWord={(idx, value) => registerSeedPhraseModel.events.updateRepeatWords(ctx, value, idx)}
    >
      <SeedPhraseHeader onChangeVisibilityStatus={v => setIsHidden(v)}>
        <p className="text-neutral-400">
          {translate["auth.register.seed-phrase.startTitle"]()}
        </p>
      </SeedPhraseHeader>
      <SeedPhraseBody />
    </SeedPhrase>
  )
}, "RegisterSeedPhraseConfirm")

const RegisterSeedPhraseSave = reatomComponent(({ ctx }) => {
  const words = ctx.spy(registerSeedPhraseModel.state.words)
  const [isHidden, setIsHidden] = useState(true);

  return (
    <div className="flex flex-col w-full gap-4">
      <SeedPhrase
        isEditable={false}
        words={words}
        isHidden={isHidden}
        className="gap-6"
      >
        <SeedPhraseHeader onChangeVisibilityStatus={v => setIsHidden(v)}>
          <p className="text-neutral-400">
            {translate["auth.register.seed-phrase.saveTitle"]()}
          </p>
        </SeedPhraseHeader>
        <SeedPhraseBody />
        <SeedPhraseFooter>
          <div className="flex items-center justify-end w-full">
            <Button
              type="button"
              background="default"
              className="gap-2"
              onClick={() => register.downloadPhrase(ctx)}
            >
              {translate["auth.register.seed-phrase.download"]()}
              <Icon name='sprite:download' className="size-4" />
            </Button>
          </div>
          <p className="text-neutral-400 text-xs text-center">
            {translate["auth.register.seed-phrase.warning"]()}
          </p>
        </SeedPhraseFooter>
      </SeedPhrase>
    </div>
  )
}, "RegisterSeedPhraseSave")

const RegisterConfirmLoading = () => {
  return (
    <>
      <IconLoader className="size-9" />
      <div className="flex flex-col gap-1 justify-center items-center w-full">
        <Typography className="text-xl font-semibold">
          {translate["auth.register.in-progress"]()}
        </Typography>
        <Typography color="gray" className="text-sm">
          {translate["auth.register.in-progress-subtitle"]()}
        </Typography>
      </div>
    </>
  )
}
const RegisterConfirmError = reatomComponent(({ ctx }) => {
  const handleToBack = () => {
    spawn(ctx, (spawnCtx) => {
      registerNavigationModel.back(spawnCtx)
      registerNavigationModel.back(spawnCtx)
      registerNavigationModel.back(spawnCtx)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full items-center justify-center">
        <Icon name="sprite:x" className="text-[32px] text-red-600" />
        <p className="text-xl w-full sm:w-2/3 leading-5 font-semibold text-center">
          {translate["auth.register.error"]()}
        </p>
      </div>
      <Button
        background="default"
        type="button"
        onClick={handleToBack}
        className="font-semibold"
      >
        {translate["auth.register.to-back"]()}
      </Button>
    </>
  )
}, "RegisterConfirmError")

const RegisterConfirmSuccess = reatomComponent(({ ctx }) => {
  return (
    <>
      <div className="flex flex-col gap-2 w-full items-center justify-center">
        <Icon name="sprite:check" className="size-8 text-green-400" />
        <p className="text-xl w-full sm:w-2/3 leading-5 font-semibold text-center">
          {translate["auth.register.success"]()}
        </p>
      </div>
      <Button
        className="w-2/3 font-semibold"
        background="white"
        onClick={() => register.toLogin(ctx)}
      >
        {translate["auth.register.toLogin"]()}
      </Button>
    </>
  )
}, "RegisterConfirmSuccess")

const REGISTER_CONFIRM_COMPONENTS: Record<"loading" | "error" | "success", (props: object) => JSX.Element> = {
  "loading": RegisterConfirmLoading,
  "error": RegisterConfirmError,
  "success": RegisterConfirmSuccess
}

const RegisterConfirm = reatomComponent(({ ctx }) => {
  const error = ctx.spy(authState.globalError)
  const isLoading = ctx.spy(register.submit.statusesAtom).isPending;
  const currentStep = isLoading ? "loading" : error ? "error" : "success";

  const Component = REGISTER_CONFIRM_COMPONENTS[currentStep]

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center">
      <Component />
    </div>
  )
}, "RegisterConfirm")

const RegisterBack = reatomComponent(({ ctx }) => {
  const canGoBack = ctx.spy(registerNavigationModel.canGoBackAtom);

  return (
    <Button
      type="button"
      disabled={!canGoBack || ctx.spy(registerNavigationModel.back.statusesAtom).isPending}
      onClick={() => spawn(ctx, (spawnCtx) => registerNavigationModel.back(spawnCtx))}
      background="default"
      className="transition-none capitalize"
    >
      {translate["shared.back"]()}
    </Button>
  )
}, "RegisterBack")
const RegisterContinue = reatomComponent(({ ctx }) => {
  const canGoNext = ctx.spy(registerNavigationModel.canGoNextAtom)

  return (
    <Button
      type="button"
      background="positive"
      className="w-full capitalize font-semibold transition-none"
      disabled={!canGoNext || ctx.spy(registerNavigationModel.next.statusesAtom).isPending}
      onClick={() => register.next(ctx)}
    >
      {translate["shared.next"]()}
    </Button>
  )
}, "RegisterContinue")

const RegisterNavigation = reatomComponent(({ ctx }) => {
  if (ctx.spy(registerNavigationModel.isLastStepAtom)) return null;

  return (
    <div className="flex sm:flex-row flex-col items-center gap-2 justify-center w-full *:w-full">
      <RegisterBack />
      <RegisterContinue />
    </div>
  )
}, "RegisterNavigation")

const STEP_COMPONENTS: Record<AuthRegisterType, ReactNode> = {
  "start-input": <RegisterStartInput />,
  "seed-phrase-save": <RegisterSeedPhraseSave />,
  "seed-phrase-confirm": <RegisterSeedPhraseConfirm />,
  "confirm": <RegisterConfirm />
};

const RegisterContent = reatomComponent(({ ctx }) =>
  STEP_COMPONENTS[ctx.spy(registerState.type)], "RegisterContent"
)

export const RegisterForm = reatomComponent(({ ctx }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    register.next(ctx);
  }

  return (
    <form className="flex flex-col gap-4 w-full h-full" onSubmit={handleSubmit}>
      <RegisterContent />
      <RegisterNavigation />
    </form>
  )
}, 'RegisterForm')
